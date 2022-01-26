const Color = require("../../color");
const Interface = require("../../interface");

module.exports = class Process extends Interface {
	constructor(...args) {
		super(...args);

		this.createFunction("process::wait", (arg)=>{
			if (this.argumentsLength(arg) == 1) {
				if (arg?.type != "NUMBER") this.throwError("Argument is supposed to be a number", "wait", "process");
				this.pauseProcess(arg?.value);
			} else {
				this.throwError("Expected exactly 1 argument", "wait", "process");
			}
		});
	}
}