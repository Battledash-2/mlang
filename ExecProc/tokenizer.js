const specification = [
    [/^\/\/[^\n]*/, null], // this needs to have a higher precedence

    [/^\.?\d+\.?\d*/, "NUMBER"], // for digits and numbers
    [/^[\+\-\/\*\^]/, "OPERATOR"], // operators
    
    [/^=>/, "CONVERT"], // conversion operators (100 => km, mi)
    [/^,/, "SEPERATOR"], // seperates (km, mi)

    [/^\(/, "LPAREN"], // opening parentheses (for functions and math)
    [/^\)/, "RPAREN"], // closing parentheses (for functions and math)

    [/^\b(var|let)\b/, "DEFINE"], // variable definition keywords (there is no such thing as a constant, nor a scope)
    [/^\b[a-zA-Z](\w|\.)*\b/, "IDENTIFIER"], // identifiers like variable names and referencing variables (also in use for conversions)

    [/^=/, null], // '=' in case someone uses (let a **=** 58) this also means you can do (let a 58)
    [/^\n/, "NL"], // new line for error messaging
    [/^\s/, null], // whitespace 
    [/^;/, null] // semi-colons
]

module.exports = class Tokenizer {
    /**
     * @param {String} s Source string
     * @param {String} fn Filename
     * @param {String} fp Absolute file path
     */
    constructor(s, fn, fp) {
        this.source = s;
        this.fn = fn;
        this.fp = fp;

        this.cursor = 0;

        this.line = 0;
        this.pos = 0;
    }

    isMultiplier(node) {
        return node.value == "*" || node.value == "/";
    }
    
    isAddition(node) {
        return node.value == "+" || node.value == "-";
    }

    eof() {
        return this.cursor >= this.source.length;
    }

    match(regex, string) {
        const match = regex.exec(string);

        if (match == null) return null;
        this.cursor += match[0].length;
        this.pos += match[0].length;

        return match[0];
    }

    nextToken() {
        if (this.eof()) return null;

        const string = this.source.slice(this.cursor);
        for (let [regex, type] of specification) {
            const match = this.match(regex, string);

            if (match == null) continue;
            switch (type) {
                case null:
                    return this.nextToken();
                case "NL":
                    this.pos = 0;
                    this.line++;
                    
                    return this.nextToken();
            }

            return {
                type,
                value: match,
                position: {
                    cursor: this.pos-(match.length-1),
                    line: this.line+1
                }
            };
        }

        throw new Error(`Unexpected token '${string.slice(0, 1)}' at ${this.fn}:${this.line}:${this.pos}`)
    }
}