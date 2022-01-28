const parseEscaped = require("./core/escape_code");

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

		const loop=()=>{
			do {
				const adv = this.variableExpression();
				body.push(adv);
			} while (this.next?.type == "EXPR_END" && this.advance("EXPR_END") && this.next?.type != "BCLOSE");
			if (this.next?.type != "BCLOSE" && this.next != null) {
				loop();
			}
		}

		if (this.next.type == "BOPEN") {
			if (this.advance("BOPEN").type != "BCLOSE") {
				loop();
			}
			
			this.advance("BCLOSE");
		} else {
			body.push(this.primary());
		}
		return {
			type: "BLOCK",
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
			body,
			position: fname.position
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
			value: parseEscaped(this.next.value.slice(1, -1)), // there isn't actual support for escapes
			position: this.next.position
		}
		if (this.advance("STRING")?.type == "CONVERT") {
			return this.convert(result);
		};
		return result;
	}

	number(origin=false) {
		let r = this.next;
		r.value = Number(r.value);
		if (this.advance()?.type == "CONVERT" && !origin) {
			return this.convert(r);
		};

		return r;
	}

	arguments(advance=true, stopOn="RPAREN") {
		if (advance) this.advance("LPAREN");
		let args = [];

		do { // a do while will run at least once
			if (this.next.type == stopOn) break;
			args.push(this.operation());
		} while (this.next?.type == "SEPERATOR" && this.advance())
		if (advance) this.advance("RPAREN");
		return args.length > 1 ? args : args[0];
	}

	/*
	assignment(value) {
		const operator = this.next.value;
		this.advance("ASSIGNMENT");
		let withOp = this.operation();

		return {
			type: "ASSIGN",
			operator,
			variable: value,
			operation: withOp,
			position: value?.position
		};
	}*/

	arraySelector(on) {
		const pos = this.next?.position;
		this.advance("LBRACK");
		const goto = this.primary();

		let result = {
			type: "ARRAY_SELECT",
			goto,
			array: on,
			position: pos
		};

		let adv = this.advance("RBRACK");
		if (adv?.type == "LBRACK") {
			return this.arraySelector(result);
		} else if (adv?.type == "ASSIGNMENT") {
			return this.assignment(result);
		}

		return result;
	}

	array() {
		const pos = this.next.position;
		this.advance("LBRACK");
		let values = this.arguments(false, "RBRACK");

		if (!Array.isArray(values)) values = [values];
		
		if (this.advance("RBRACK")?.type == "LBRACK") {
			return this.arraySelector(values);
		}

		return {
			type: "ARRAY",
			values,
			position: pos
		}
	}

	fcall(n) {
		this.advance("LPAREN");
		let arg = this.arguments(false);

		const result = {
			type: "FCALL",
			name: n,
			arg,
			position: {
				line: arg?.position?.line || n.position.line,
				cursor: arg?.position?.cursor || n.position.cursor
			}
		}

		if (this.advance("RPAREN")?.type == "LBRACK") {
			return this.arraySelector(result);
		}
		return result;
	}

	assignment(value) {
		const operator = this.next.value;
		this.advance("ASSIGNMENT");
		let withOp = this.operation();

		return {
			type: "ASSIGN",
			operator,
			variable: value,
			operation: withOp,
			position: value?.position
		};
	}

	identifier() {
		let r = this.next;
		let a = this.advance();
		if (a?.type == "LPAREN") {
			return this.fcall(r);
		} else if (a?.type == "CONVERT") {
			return this.convert(r);
		} else if (a?.type == "ASSIGNMENT") {
			return this.assignment(r);
		} else if (a?.type == "LBRACK") {
			return this.arraySelector(r);
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

	export() {
		const exportName = this.advance("EXPORT").value;
		this.advance("IDENTIFIER");
		
		return {
			type: "EXPORT",
			name: exportName,
			position: this.next?.position
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
			value: this.next.value == "false" ? false : true,
			position: this.next.position
		}
		if (this.advance("BOOLEAN")?.type == "CONVERT") {
			return this.convert(result);
		};
		return result;
	}

	operations() {
		let declarations = [];
		let statement = {};

		const loop=()=>{
			do {
				const adv = this.condition();
				if (adv.type == "DEFINITION") {
					declarations.push(adv);
				} else {
					statement = adv;
					break;
				}
			} while (this.next?.type == "EXPR_END" && this.advance("EXPR_END") && this.next?.type != "RPAREN");
			if (this.next?.type != "RPAREN" && this.next != null) {
				loop();
			}
		}

		if (this.advance("LPAREN").type != "BCLOSE") {
			loop();
		}
		
		this.advance("RPAREN");
		return {
			type: "OPERATION",
			declarations,
			statement
		}
	}

	loop() {
		const position = this.next.position;
		this.advance("LOOP");
		const operation = this.operations();
		const body = this.block();

		return {
			type: "LOOP",
			operation,
			body,
			position
		};
	}

	emptyStatement() {
		this.advance();
		return {
			type: "Empty"
		};
	}

	primary(origin=false) {
		switch (this.next?.type) {
			case "EXPR_END":
				return this.emptyStatement();
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
				return this.number(origin);
			case "IMPORT":
				return this.import();
			case "EXPORT":
				return this.export();
			case "CONDITIONAL": // CONDITIONAL_ELSE
				return this.conditional();
			case "BOOLEAN":
				return this.boolean();
			case "OPERATOR":
				return this.operation();
			case "LOOP":
				return this.loop();
			case "EXPR_END":
				return null;
			case "LBRACK":
				return this.array();
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
			num = this.primary(true);
		}

		const res = {
			type: "UNARY",
			value: num,
			operator: op?.value,
			position: {
				cursor: op?.position?.cursor,
				line: op?.position?.line
			}
		};

		if (this.next?.type == "CONVERT") {
			return this.convert(res);
		}

		if (op != null) return res;
		return this.primary();
	}

	condition() {
		let left = this.unary();
		let position = left.position;

		while (this.next?.type == "CONDITION" && this.tokens.isOperation(this.next)) {
			const operator = this.next.value;
			this.advance("CONDITION");
			const right = this.unary();

			left = {
				type: "OPERATION",
				operator,
				left,
				right
			}
		}

		return {
			type: "OPERATION",
			...left,
			position
		};
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
		if (left == null) return left;
		let position = left.position;

		while (this.next?.type == "OPERATOR" && this.tokens[tcheck](this.next)) {
			const operator = this.next.value;
			this.advance("OPERATOR");
			const right = this[next]();

			left = {
				type: "OPERATION",
				operator,
				left,
				right
			}
		}

		return {
			type: "OPERATION",
			...left,
			position
		};
	}

	operation() {
		return this.addition();
	}

	variableExpression() {
		if (this.next?.type != "DEFINE") return this.operation();

		const kind = this.next?.value;
		const vName  = this.advance("DEFINE").value;
		this.advance();
		this.advance("ASSIGNMENT");
		const vValue = this.operation();

		return {
			type: "DEFINITION",
			name: vName,
			value: vValue,
			kind,
			position: {
				line: this.next?.position.line,
				cursor: this.next?.position.cursor
			}
		}
	}

	program() {
		const body = [];
		const loop=()=>{
			do {
				const adv = this.variableExpression();
				body.push(adv);
			} while (this.next?.type == "EXPR_END" && this.advance("EXPR_END"));
			if (this.next != null) {
				loop();
			}
		}
		loop();
		return {
			type: "program",
			body
		}
	}

	advance(type=null) {
		function throwError(error) {
			throw new Error(error);
		};
		if (type != null) {
			if (this.next == null) throwError(`Unexpected end of input while expecting '${type}'`);
			if (this.next.type != type) throwError(`Unexpected token '${this.next.type}': Expected type of '${type}' (${this.fn}:${this.next.position.line}:${this.next.position.cursor})`);
		}

		this.next = this.tokens.nextToken();
		return this.next;
	}
}
