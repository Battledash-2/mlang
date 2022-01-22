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

		// process/out.write
		this.createFunction("process::out::write", (arg)=>{
			let send = "";
			if (this.argumentsLength(arg) > 1) {
				send = arg.map(c=>Color(c)).join(" ");
			} else {
				send = Color(arg);
			}

			process.stdout.write(send);
		});
	}
}