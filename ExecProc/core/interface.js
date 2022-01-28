const Typeof = require("./typeof");
module.exports = class InterpreterInterface {
	constructor(interpreter) {
		this.interface = interpreter;
	}

	// Functional
	pauseProcess(ms=0) {
		const end = Date.now() + ms;
		while (Date.now() < end) continue;
		return true;
	}
	throwError(error, functionName, moduleName) {
		throw new Error(
			`${error} in ${moduleName}/${functionName} ${this.errorPosition()}`
		);
	}

	// Imports
	importFile(file) {
		return this.interface.importFile({ file });
	}
	importFromText(value, as="_") {
		const tokens = new Tokenizer(value, "import", "import");
		const ast = new Parser(tokens, "import", "import");
		const exported = new Interpreter(ast, "import", "import", true);

		Object.entries(exported).forEach(([name, value]) => {
			if (value.type === "DEFINEF") {
				this.interface.userFunctions[as + "::" + name] = value.body;
			} else {
				this.interface.local[as + "::" + name] = value.value;
			}
		});
	}

	// For error logging
	errorPosition() {
		return `(${this.getFilename()}:${this.getPosition()})`;
	}
	getPosition() {
		return (
			this.interface.pos?.position?.line +
			":" +
			this.interface.pos?.position?.cursor
		);
	}
	getLine() {
		return this.interface.pos?.position?.line;
	}
	getCursor() {
		return this.interface.pos?.position?.cursor;
	}
	getFilename() {
		return this.interface.fn;
	}
	getPositionObject() {
		return this.interface.pos?.position;
	}

	// Arguments
	expectArguments(amount=1, args, functionName="N/A", moduleName="N/A", allowMore) {
		if (allowMore && this.argumentsLength(args) >= amount) return true;
		if (this.argumentsLength(args) !== amount)
			this.throwError(
				`Expected ${amount} arguments, received ${this.argumentsLength(args)}`,
				functionName,
				moduleName
			);
	}

	argumentsLength(args) {
		return (args?.value ? 1 : args?.length) || 0;
	}
	createArgumentList(args) {
		return [...args.map((c) => this.getTokenFrom(c))];
	}
	getArgumentValues(args) {
		return args?.map?.((c) => c?.value) || [];
	}
	concatValues(args, sep=" ") {
		return args?.map?.((c) => c?.value).join(sep) || args?.value || "";
	}
	getArgumentAt(args, pos=0) {
		const argLen = this.argumentsLength(args);
		if (pos === 0 && argLen === 1) {
			return args?.value;
		} else {
			if (argLen < pos) return null;
			return args[pos]?.value;
		}
	}
	getArgumentObjectAt(args, pos=0) {
		const argLen = this.argumentsLength(args);
		if (pos === 0 && argLen === 1) {
			return args;
		} else {
			if (argLen < pos || args[pos] == null) return null;
			return args[pos];
		}
	}

	// Functions
	isUserFunction(arg) {
		return this.interface?.userFunctions[arg] != null;
	}
	isBuiltInFunction(arg) {
		return typeof this.interface?.local[arg] == "function";
	}
	isFunction(arg) {
		return this.isUserFunction(arg) || this.isBuiltInFunction(arg);
	}

	// Variables
	createVariable(name="", value="") {
		this.interface.createVar(value, name, true);
	}
	deleteVariable(name="") {
		this.interface.deleteVar(name);
	}
	getVariable(name="") {
		return this.interface.getVar(name);
	}
	variableExists(name="") {
		return this.interface.varExists(name);
	}

	// Pointers
	createPseudoPointer(pointerName="", variableName="") {
		this.interface.setPointer(pointerName, variableName);
	}
	deletePseudoPointer(pointerName="") {
		this.interface.deletePointer(pointerName);
	}

	// Functions
	createFunction(name="", callback=(arg={ value: "" }) => {return false;}) {
		this.interface.local[name]=callback;
	}
	deleteUserFunction(name="") {
		delete this.interface.userFunctions[name];
	}
	deleteBuiltInFunction(name="") {
		delete this.interface.local[name];
	}
	deleteFunction(name="") {
		if (this.isBuiltInFunction(name))
			return this.deleteBuiltInFunction(name);
		return this.deleteUserFunction(name);
	}
	executeFunction(name="", argument={ type: "", value: 0, position: { line: 0, cursor: 0 } }) {
		return this.interface.fcall({
			name: {
				value: name,
			},
			arg: argument,
		});
	}

	// Conversions
	createConversion(from="", to="", callback=(arg={ value: "" }) => {return false;}) {
		this.interface.conversions[`${from}-${to}`]=callback;
	}
	deleteConversion(from="", to="") {
		delete this.interface.conversions[`${from}-${to}`];
	}
	executeConversion(value=0, from="", to="") {
		if (this.interface.userConversions.hasOwnProperty(`${node.from?.value}-${node.to?.value}`)) {
			return this.interface.execConvert(`${from}-${to}`, this.interface.loop(value));} else if (this.interface.conversions.hasOwnProperty(`${from}-${to}`)) {
			return {
				type: "NUMBER",
				value: this.interface.conversions[`${from}-${to}`](
					this.loop(value)
				),
				position: {
					cursor: "N/A",
					line: "N/A",
				},
			};
		} else {
			throw new Error(
				`Unknown unit '${node.from?.value}-${node.to?.value}' or not yet supported (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
			);
		}
	}

	// Tokens
	createToken(type="", value="", position={ cursor: 0, line: 0 }) {
		return this.interface.createToken(type, value, position);
	}
	getTokenFrom(value) {
		// not recommended
		return this.interface.createToken(
			Typeof(value).toString().toUpperCase(),
			value,
			this.interface.pos?.position
		);
	}
	getTokenListFrom(...values) {
		let lt = values;
		if (typeof arguments[0] == "object" && Array.isArray(arguments[0])) {
			lt = arguments[0];
		}
		return lt.map((c) => this.getTokenFrom(c));
	}
	getTokenTypeFrom(value) {
		return Typeof(value).toString().toUpperCase();
	}

	// Types
	typeAssert(type, arg) {
		return arg?.type === type || Typeof(arg?.value) === type;
	}
	typeAssertError(type, arg, fname, mname) {
		if (arg?.type !== type && Typeof(arg?.value) !== type) {
			this.throwError(
				`Expected type '${type}', received '${arg?.type || "none"}'`,
				fname,
				mname
			);
		}
		return true;
	}

	typeAssertStrict(type, arg) {
		return arg?.type == type;
	}
	typeAssertStrictError(type, arg, fname, mname) {
		if (arg?.type !== type) {
			this.throwError(
				`Expected type '${type}', received '${arg?.type || "none"}'`,
				fname,
				mname
			);
		}
		return true;
	}
};
