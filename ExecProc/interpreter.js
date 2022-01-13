const operations = {
    "^": (l, r) => l ** r,

    "*": (l, r) => l * r,
    "/": (l, r) => l / r,

    "+": (l, r) => l + r,
    "-": (l, r) => l - r
}

module.exports = class Interpreter {
    constructor(ast, fn, fp) {
        this.fn = fn;
        this.fp = fp;

        this.enum = 0;

        this.variables = { // predefine functions an variables here (note: these can be overwritting by the user, although they cannot create functions)
            "util.pi": Math.PI,
            "util.enum": (_arg, _pos, caller)=>{return this.createToken("NUMBER", ++this.enum, caller.position);},
            "util.log": (arg)=>console.log(arg.value),
            "util.sin": (arg, pos)=>this.createToken("NUMBER", Math.sin(arg.value), pos.position),
            "util.cosin": (arg, pos)=>this.createToken("NUMBER", Math.cos(arg.value), pos.position)
        };
        this.pos;
        
        return this.start(ast.body);
    }

    createToken(type, value, position) {
        return {
            type,
            value,
            position
        }
    }

    evaluate({ value: l }, { value: r }, operator) {
        if (operator != null) {
            if (l.type == "IDENTIFIER") {
                l = this.getVar(l.value);
            }
            if (r.type == "IDENTIFIER") {
                r = this.getVar(r.value);
            }

            return operations[operator](l, r);
        }
    }

    getVar(name) {
        if (this.varExists(name)) {
            return this.variables[name];
        }
        throw new Error(`Attempted to GET an uninitialized variable: '${name}' ${this.variables[name]} (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`);
    }
    varExists(name) {
        return this.variables[name] == null ? false : true;
    }
    createVar(value, name) {
        this.variables["util.last"] = value;
        this.variables[name] = value;
    }

    start(node) {
        let r = [];
        for (let o in node) {
            const add = this.loop(node[o]);
            if (add == null) continue;
            r.push(add);
        }
        return r;
    }

    /**
     * return {
            type: "FCALL",
            name: n,
            arg,
            position: {
                line: arg.position.line,
                cursor: arg.position.cursor
            }
        }
     */

    fcall(node) {
        const fname = node.name.value;
        const arg = node.arg != null ? this.loop(node.arg) : node.arg;

        return this.getVar(fname)(arg, node.arg, node);
    }

    loop(node) {
        if (node?.type == "definition") {
            this.pos = node;
            if (node.value.left) {
                this.createVar(this.evaluate(
                    this.loop(node.value.left),
                    this.loop(node.value.right),
                    node.value.operator
                ), node.name);
            } else if(node.value.type == "IDENTIFIER") {
                this.createVar(this.getVar(node.value.value), node.name)
            } else if(node.value.type == "FCALL") {
                this.createVar(this.loop(this.fcall(node.value))?.value, node.name);
            } else {
                this.createVar(node.value, node.name);
            }
            return null;
        }
    
        if (node?.type == "IDENTIFIER") {
            // console.log("A", node?.type, node)
            this.pos = node;
            return {
                type: node.type,
                value: this.getVar(node.value),
                position: node.position
            }
        }

        if (node?.type == "FCALL") {
            this.pos = node;
            return this.fcall(node);
        }

        if (node?.value) {
            this.pos = node;
            return node;
        }

        // if (typeof node == "number") {
        //     return node;
        // }
        // if (typeof node == "string") {
        //     return this.getVar(node);
        // }

        return {
            type: node.type,
            value: this.evaluate(
                this.loop(node.left),
                this.loop(node.right),
                node.operator // this could be `null`
            ),
            position: node.position
        }
    }
}