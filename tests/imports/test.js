const Interface = require("../../ExecProc/core/interface");

module.exports = class Test extends Interface {
	constructor(...args) {
		super(...args);

		this.createFunction("test::works", (arg) => {
			console.log(arg, true, this.argumentsLength(arg));
		});
	}
};
