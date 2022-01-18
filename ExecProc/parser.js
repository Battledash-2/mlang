module.exports = class Parser {
    constructor(tokens, fn, fp) {
        this.tokens = tokens;
        this.next = this.tokens.nextToken();

        this.fn = fn;
        this.fp = fp;

        return this.program();
    }
    
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
    
    convertDefinition() {
        const fname = this.advance("DEFINEC");
        this.advance("IDENTIFIER");
        const fname2 = this.advance("SEPERATOR");
        this.advance("IDENTIFIER");
        const body = this.block();

        return {
            type: "DEFINEC",
            name: [fname, fname2],
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
        if (this.advance("STRING")?.type == "CONVERT") {
            return this.convert(result);
        };
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

    arguments() {
        this.advance("LPAREN");
        let args = [];

        do { // a do while will run at least once
            if (this.next.type == "RPAREN") break;
            args.push(this.primary());
        } while (this.next?.type == "SEPERATOR" && this.advance())

        this.advance("RPAREN");
        return args.length > 1 ? args : args[0];
    }

    fcall(n) {
        let arg = this.arguments();
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
    
    conditional() {
        let pass, fail;

        this.advance("CONDITIONAL");
        this.advance("LPAREN");
        const condition = this.condition();
        this.advance("RPAREN");

        pass = this.block();

        if (this.next?.type == "CONDITIONAL_ELSE" && this.advance()) {
            fail = this.block();
        }

        return {
            type: "CONDITION",
            condition,
            pass,
            fail
        }
    }

    boolean() {
        const result = {
            type: "BOOLEAN",
            value: Boolean(this.next.value),
            position: this.next.position
        }
        if (this.advance("BOOLEAN")?.type == "CONVERT") {
            return this.convert(result);
        };
        return result;
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
 			case "DEFINEC":
				return this.convertDefinition();
            case "STRING":
                return this.string();
            case "NUMBER":
                return this.number();
            case "IMPORT":
                return this.import();
            case "CONDITIONAL": // CONDITIONAL_ELSE
                return this.conditional();
            case "BOOLEAN":
                return this.boolean();
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
            type: "UNARY",
            value: num,
            operator: op.value,
            position: {
                cursor: op.position.cursor,
                line: op.position.line
            }
        }

        return this.primary();
    }

    condition() {
        return this.operationBuilder("isOperation", "unary");
    }

    exponent() {
        return this.operationBuilder("isExponent", "unary");
    }

    multiplication() {
        return this.operationBuilder("isMultiplier", "exponent");
    }

    addition() {
        return this.operationBuilder("isAddition", "multiplication");
    }

    operationBuilder(tcheck="isAddition", next="multiplication") {
        let left = this[next]();
        let position = left.position;

        while (this.next?.type == "OPERATOR" && this.tokens[tcheck](this.next)) {
            const operator = this.next.value;
            this.advance("OPERATOR");
            const right = this[next]();

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
                line: this.next?.position.line,
                cursor: this.next?.position.cursor
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
