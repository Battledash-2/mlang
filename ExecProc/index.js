const Tokenizer = require("./tokenizer");
const Parser = require("./parser");
const Interpreter = require("./interpreter");

module.exports = class ExecProc {
	constructor(source, filename, absolutePath, scope) {
		const tokens = new Tokenizer(source, filename, absolutePath);
		const ast = new Parser(tokens, filename, absolutePath);

		// return		 ast;

		return new Interpreter(ast, filename, absolutePath, false, scope);
	}
};
