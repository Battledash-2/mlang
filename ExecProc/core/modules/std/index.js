const Color = require("../../color");
const Interface = require("../../interface");

module.exports = class Standard extends Interface {
    constructor(...args) {
        super(...args);

		// could be helpful
		this.createFunction("std::clear", ()=>{
			process.stdout.write("\u001bc");
		});
		this.createFunction("std::out::write", (arg)=>{
			process.stdout.write(this.concatValues(arg));
		});

        // main
        this.createFunction("std::log", (arg)=>{
			let send = "";
			if (this.argumentsLength(arg) > 1) {
				send = arg.map(c=>Typeof(c.value) != "STRING" ? Color(c) : c?.value).join(" ");
			} else {
				send = Typeof(arg?.value) != "STRING" ? Color(arg) : arg?.value;
			}

			console.log("\u001b[1;38;5;8mLog: \u001b[0m"+send);
        });
        this.createFunction("std::warn", (arg)=>{
            console.log("\u001b[1;38;5;11mWarning: \u001b[0m"+arg.value);
        });
        this.createFunction("std::error", (arg)=>{
            console.log("\u001b[1;38;5;9mError: \u001b[0m"+arg.value);
        });

        // other
        this.createFunction("std::debug", (arg)=>{
            console.log("\u001b[1;38;5;202mDebug: \u001b[0m"+arg.value);
        });

        // actual errors
        this.createFunction("std::throw", (arg)=>{
            throw new Error(String(arg.value) + " " + this.errorPosition());
        });
    }
}