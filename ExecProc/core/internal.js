// **Simplified and modified version of 'interface' meant for internal use**

const Typeof = require("./typeof");
module.exports = class InterpreterInterface {
	constructor(fn) {
		this.fn = fn;
		return true;
	}

	// Functional
	throwError(error, functionName="N/A", moduleName="N/A", position) {
		throw new Error(
			`${error} in ${moduleName}/${functionName} (${this.fn}:${position.line}:${position.cursor})`
		);
	}

	// Arguments
	expectArguments(amount=1, args, functionName="N/A", moduleName="N/A", allowMore, pos) {
		if (allowMore && this.argumentsLength(args) >= amount) return true;
		if (this.argumentsLength(args) !== amount)
			this.throwError(
				`Expected ${amount} arguments, received ${this.argumentsLength(args)}`,
				functionName,
				moduleName,
				pos
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
	typeAssertError(type, arg, fname, mname, pos) {
		if (arg?.type !== type && Typeof(arg?.value) !== type) {
			console.log(arg)
			this.throwError(
				`Expected type '${type}', received '${arg?.type || "none"}'`,
				fname,
				mname,
				pos
			);
		}
		return true;
	}

	typeAssertStrict(type, arg) {
		return arg?.type == type;
	}
	typeAssertStrictError(type, arg, fname, mname, pos) {
		if (arg?.type !== type) {
			this.throwError(
				`Expected type '${type}', received '${arg?.type || "none"}'`,
				fname,
				mname,
				pos
			);
		}
		return true;
	}
};
