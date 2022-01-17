module.exports = class Parser {
    constructor(tokens, fn, fp) {
        this.tokens = tokens;
        this.next = this.tokens.nextToken();

        this.fn = fn;
        this.fp = fp;

        return this.program();
    }

    /*
        [/^\bfunc\b/, "DEFINEF"], // functions definition keyword
        [/^{/, "BOPEN"], // block open 
        [/^}/, "BCLOSE"], // block close
    */
    block() {
        const body = [];
        this.advance("BOPEN");
        while(this.next.type != "BCLOSE") {
            const adv = this.variableExpression();
            body.push(adv);
        }
        this.advance("BCLOSE");
        return {
            type: 'BLOCK',
            body
        }
    }

    functionDefinition() {
        const fname = this.advance("DEFINEF");
        this.advance("IDENTIFIER");
        const body = this.block();

        return {
            type: "DEFINEF",
            name: fname,
            body
        }
    }

    convert(num=0) {
        const from = this.advance("CONVERT");
        this.advance("IDENTIFIER");
        const to = this.advance("SEPERATOR");
        this.advance("IDENTIFIER");

        return {
            type: "CONVERT",
            value: num,
            from,
            to,
            position: num.position
        }
    }

    string() {
        const result = {
            type: "STRING",
            value: this.next.value.slice(1, -1).replace(/\\("|')/g, "$1").replace(/\\\\/g, "\\").replace(/\\n/, "\n"), // there isn't actual support for escapes
            position: this.next.position
        }
        this.advance("STRING");
        return result;
    }

    number() {
        let r = this.next;
        r.value = Number(r.value);
        if (this.advance()?.type == "CONVERT") {
            return this.convert(r);
        };

        return r;
    }

    fcall(n) {
        this.advance("LPAREN");
        let arg = null;
        if (this.next.type == "RPAREN") {
            this.advance("RPAREN");
        } else {
            arg = this.operation();
            this.advance("RPAREN");
        }
        return {
            type: "FCALL",
            name: n,
            arg,
            position: {
                line: arg?.position?.line || n.position.line,
                cursor: arg?.position?.cursor || n.position.cursor
            }
        }
    }

    identifier() {
        let r = this.next;
        let a = this.advance();
        if (a?.type == "LPAREN") {
            return this.fcall(r);
        } else if (a?.type == "CONVERT") {
            return this.convert(r);
        }

        return r;
    }

    parentheses() {
        this.advance("LPAREN");
        const r = this.operation();
        this.advance("RPAREN");
        return r;
    }

    import() {
        const position = this.next.position;
        const importFile = this.advance("IMPORT");
        this.advance("STRING");
        return {
            type: "IMPORT",
            file: importFile.value.slice(1, -1),
            position
        }
    }

    primary() {
        switch (this.next?.type) {
            case "DEFINE":
                return this.variableExpression();
            case "LPAREN":
                return this.parentheses();
            case "IDENTIFIER":
                return this.identifier();
            case "DEFINEF":
                return this.functionDefinition();
            case "STRING":
                return this.string();
            case "NUMBER":
                return this.number();
            case "IMPORT":
                return this.import();
            default:
                const r = this.next;
                this.advance();
                return r;
        }
    }

    unary() {
        let op, num; // operator and number

        if (this.next?.type == "OPERATOR" && this.tokens.isAddition(this.next)) {
            op = this.next;
            this.advance("OPERATOR");
            num = this.primary();
        }

        if (op != null) return {
            type: "NUMBER",
            value: Number(op.value + String(num.value)),
            position: {
                cursor: op.position.cursor,
                line: op.position.line
            }
        }

        return this.primary();
    }

    exponent() {
        let left = this.unary();
        let position = left.position;

        while (this.next?.type == "OPERATOR" && this.next.value == "^") {
            const operator = this.next.value;
            this.advance("OPERATOR");
            const right = this.unary();

            left = {
                operator,
                left,
                right
            }
        }

        return {
            ...left,
            position
        };
    }

    multiplication() {
        let left = this.exponent();
        let position = left.position;

        while (this.next?.type == "OPERATOR" && this.tokens.isMultiplier(this.next)) {
            const operator = this.next.value;
            this.advance("OPERATOR");
            const right = this.exponent();

            left = {
                operator,
                left,
                right
            }
        }

        return {
            ...left,
            position
        };
    }

    addition() {
        let left = this.multiplication();
        let position = left.position;

        while (this.next?.type == "OPERATOR" && this.tokens.isAddition(this.next)) {
            const operator = this.next.value;
            this.advance("OPERATOR");
            const right = this.multiplication();

            left = {
                operator,
                left,
                right
            }
        }

        return {
            ...left,
            position
        };
    }

    operation() {
        return this.addition();
    }

    variableExpression() {
        if (this.next?.type != "DEFINE") return this.operation();

        const vName  = this.advance("DEFINE").value;
        this.advance();
        const vValue = this.operation();

        return {
            type: "DEFINITION",
            name: vName,
            value: vValue,
            position: {
                line: this.next.position.line,
                cursor: this.next.position.cursor
            }
        }
    }

    program() {
        const body = [];
        while(true) {
            if (this.next == null) break;
            const adv = this.variableExpression();
            body.push(adv);
        }
        return {
            type: 'program',
            body
        }
    }

    advance(type=null) {
        if (type != null) {
            if (this.next == null) throw new Error(`Unexpected end of input while expecting '${type}'`);
            if (this.next.type != type) throw new Error(`Unexpected token '${this.next.type}': Expected type of '${type}' (${this.fn}:${this.next.position.line}:${this.next.position.cursor})`);
        }

        this.next = this.tokens.nextToken();
        return this.next;
    }
}