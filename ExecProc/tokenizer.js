const specification = [
	[/^\/\/[^\n]*|^\/\*[\s\S]+?\*\//, "CMNT"], // this needs to have a higher precedence

	[/^\.?\d+\.?\d*\b/, "NUMBER"], // for digits and numbers

	[/^=>/, "CONVERT"], // conversion operators (100 => km, mi)
	
	[/^(===?|!==?|>=?|<=?|&&|\|\|)/, "CONDITION"], // operators
	[/^(=|\+=|-=|\*=|%=|\^=)/, "ASSIGNMENT"], // operators

	[/^[\+\-\/\*\^]/, "OPERATOR"], // operators
	
	[/^,/, "SEPERATOR"], // seperates (km, mi)

	[/^\(/, "LPAREN"], // opening parentheses (for functions and math)
	[/^\)/, "RPAREN"], // closing parentheses (for functions and math)

	[/^\[/, "LBRACK"], // opening parentheses (for functions and math)
	[/^\]/, "RBRACK"], // closing parentheses (for functions and math)

	[/^\bfunc\b/, "DEFINEF"], // functions definition keyword
	[/^\b(convert|conversion)\b/, "DEFINEC"], // define conversion
	[/^{/, "BOPEN"], // block open 
	[/^}/, "BCLOSE"], // block close
	
	[/^\bwhile\b/, "LOOP"],
	[/^\bbreak\b/, "BREAK"],

	[/^\bimport\b/, "IMPORT"],
	[/^\bexport\b/, "EXPORT"],

	[/^\bif\b/, "CONDITIONAL"], // booleans (for operations)
	[/^\belse\b/, "CONDITIONAL_ELSE"], // booleans (for operations)
	[/^\b(true|false)\b/, "BOOLEAN"], // booleans (for operations)

	[/^("|')((?:\\\1|(?:(?!\1).))*)\1|^`((?:\\`|(?:(?!`))[\s\S])*)`/, "STRING"],

	[/^\b(var|let|const)\b/, "DEFINE"], // variable definition keywords (there is no such thing as a constant, nor a scope)
	[/^[a-zA-Z_$](\w|\.|\:)*\b/, "IDENTIFIER"], // identifiers like variable names and referencing variables (also in use for conversions)

	[/^\n/, "NL"], // new line for error messaging
	[/^\s/, null], // whitespace 
	[/^;/, "EXPR_END"] // semi-colons
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

	isExponent(node) {
		return node.value == "^";
	}

	isMultiplier(node) {
		return node.value == "*" || node.value == "/";
	}
	
	isAddition(node) {
		return node.value == "+" || node.value == "-";
	}

	isOperation(node) {
		// (===?|!==?|>=?|<=?|&&)
		// ^(=|\+=|-=|\*=|%=)
		return node.value.match(/^(===?|!==?|>=?|<=?|&&|\|\|)/)?.length > 0;
	}

	isAssignment(node) {
		// (===?|!==?|>=?|<=?|&&)
		// ^(=|\+=|-=|\*=|%=)
		return node.value.match(/^(=|\+=|-=|\*=|%=|\^=)/)?.length > 0;
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
				case "CMNT":
					// const newlines = this.match(/\n+/g, match);
					// this.line += newlines?.length+1;
					// if (newlines?.length > 0) this.pos = 0;
					// console.log(newlines, 'n', newlines?.length);
					// return this.nextToken();
					var line = match.match(/\n+/g)?.length > -1 ? match.match(/\n+/g).length : 0;
					this.line += line;
					this.pos = line > 0 ? 0 : this.pos;
					return this.nextToken();
				case "STRING":
					var line = match.match(/\n+/g)?.length > -1 ? match.match(/\n+/g).length : 0;
					this.line += line;
					this.pos = line > 0 ? 0 : this.pos;
					break;
			}

			return {
				type,
				value: match,
				position: {
					cursor: this.pos-(match.length-1),
					line: this.line+1
				}
			};;
		}

		throw new Error(`Unexpected token '${string.slice(0, 1)}' at ${this.fn}:${this.line+1}:${this.pos+1}`);
	}
}
