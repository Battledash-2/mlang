const fs = require("fs");
const Tokenizer = require("./tokenizer");
const Parser    = require("./parser");

const conversions = require("./core/convert");

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

        this.variables = require("./core/main")(this.createToken);
        this.userFunctions = {}; // functions defined by user
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

    getVar(name, withError=true) {
        if (this.varExists(name)) {
            return this.variables[name];
        }
        if (withError) throw new Error(`Attempted to GET an uninitialized variable: '${name}' (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`);
    }
    deleteVar(name, withError=true) {
        if (this.varExists(name)) {
            delete this.variables[name];
            return null;
        }
        if (withError) throw new Error(`Attempted to DELETE an uninitialized variable: '${name}' (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`);
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

    execFunc(fname, arg) {
        if (this.userFunctions[fname]) {
            this.createVar(arg?.value, "util.arg");
            const result = this.start(this.userFunctions[fname])[0] || null;
            this.deleteVar("util.arg", false);
            return result;
        }
        throw new Error(`Attempted to GET an uninitialized function: '${fname}' (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`);
    }

    fcall(node) {
        const fname = node.name.value;
        const arg = node.arg != null ? this.loop(node.arg) : node.arg;

        if (typeof this.getVar(fname, false) == "function") {
            return this.getVar(fname)(arg, node.arg, node);
        } else {
            return this.execFunc(fname, arg, node.arg, node);
        }
    }

    loop(node) {
        if (node?.type == "DEFINITION") {
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
                this.createVar(this.loop(node.value).value, node.name);
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

        if (node?.type == "CONVERT") {
	    if (this.userConversions.hasOwnProperty(`${node.from?.value}-${node.to?.value}`)){
                return this.execConvert(`${node.from?.value}-${node.to?.value}`, this.loop(node.value))
	    } else if (conversions.hasOwnProperty(`${node.from?.value}-${node.to?.value}`)) {
                return {
                    type: "NUMBER",
                    value: conversions[`${node.from?.value}-${node.to?.value}`](this.loop(node.value)),
                    position: node?.position
                }
            } else {
                throw new Error(`Unknown unit '${node.from?.value}-${node.to?.value}' or not yet supported (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`);
            }
        }


        if (node?.type == "DEFINEF") { // this.userFunctions
            this.pos = node;

            const fname = node?.name?.value;
            const fbody = node?.body?.body;
            this.userFunctions[fname] = fbody;
            
            return null;
        }

        if (node?.type == "DEFINEC") { // this.userFunctions
            var fname = node?.name;
	    var fname = fname[0]?.value+'-'+fname[1]?.value
            const fbody = node?.body?.body;
	    this.userConversions[fname] = fbody

            return null;
        }
        
        if (node?.type == "IMPORT") {
            this.pos = node;
            if (fs.existsSync(node?.file)) {
                const fileContent = fs.readFileSync(node?.file);
                const parsed = new Parser(new Tokenizer(String(fileContent), node?.file, node?.file), node?.file, node?.file);
                this.start(parsed.body);
            } else {
                throw new Error(`Attempt to import a non-existent file '${node?.file}' (${this.fn}:${this.pos.position.line}:${this.pos.position.cursor})`);
            }
            return null;
        }

        /*
        type: "UNARY",
            value: Number(num.value),
            operator: op.value,
            position: {
                cursor: op.position.cursor,
                line: op.position.line
            }
            */
        if (node?.type == "UNARY") {
            this.pos = node;
            return {
                type: "NUMBER",
                value: Number(node?.operator + this.loop(node?.value).value),
                position: node?.position
            };
        }

        if (node?.value) {
            this.pos = node;
            return node;
        }

        if (node != null) this.pos = node;
        
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
