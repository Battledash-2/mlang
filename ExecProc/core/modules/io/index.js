const Readline = require("readline");
const IO = require("./stream");
const Interface = require("../../interface");

module.exports = class IOUtil extends Interface {
	constructor(...args) {
		super(...args);

		this.createFunction("io::write", (args)=>{
			this.expectArguments(1, args, "write", "io", false);
			process.stdout.write(args?.value);
		});

		this.createFunction("io::read", (arg)=>{
			this.expectArguments(1, arg, "read", "io", true);

			let prompt = this.getArgumentObjectAt(arg, 0);
			let mask = this.getArgumentObjectAt(arg, 1);

			this.typeAssertError("STRING", prompt, "read", "io");
			prompt = prompt.value;
			mask = mask?.value ?? null;

			return this.createToken("STRING", IO.prompt(prompt, mask), this.getPositionObject());
		});

		this.createFunction("io::readcb", (arg)=>{
			this.expectArguments(2, arg, "readcb", "io", true);

			let prompt = this.getArgumentObjectAt(arg, 0);
			let callback = this.getArgumentObjectAt(arg, 1);

			this.typeAssertError("STRING", prompt, "readcb", "io");
			this.typeAssertError("IDENTIFIER", callback, "readcb", "io");
			
			prompt = prompt.value;
			callback = callback.name;

			const cbStream = Readline.createInterface({
				input: process.stdin,
				output: process.stdout
			});
			this.createFunction("io::close", ()=>{
				cbStream.close();
				this.deleteBuiltInFunction("io::close");
			});
			cbStream.question(prompt, (r)=>{
				this.executeFunction(callback, this.createToken("STRING", r, this.getPositionObject()));
			});
		});
	}
}