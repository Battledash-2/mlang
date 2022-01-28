const Interface = require("../../interface");

module.exports = class StringUtil extends Interface {
	constructor(...args) {
		super(...args);

		const stringFunctions = {
			indexof: (args) => {
				this.expectArguments(2, args, "indexof", "array", true);

				const stmo = this.getArgumentObjectAt(args, 0);
				const char = this.getArgumentObjectAt(args, 1);

				this.typeAssertError("ARRAY", stmo, "indexof", "array");
				this.typeAssertError("NUMBER", char, "indexof", "array");

				return this.createToken(
					"NUMBER",
					stmo?.value.indexOf(char?.value),
					this.getPositionObject()
				);
			},

			at: (args) => {
				this.expectArguments(2, args, "at", "array", true);

				const stmo = this.getArgumentObjectAt(args, 0);
				const char = this.getArgumentObjectAt(args, 1);

				this.typeAssertError("ARRAY", stmo, "at", "array");
				this.typeAssertError("NUMBER", char, "at", "array");

				return this.createToken(
					"NUMBER",
					stmo?.value?.charAt(char?.value) || "",
					this.getPositionObject()
				);
			},

			codeat: (args) => {
				this.expectArguments(2, args, "codeat", "array", true);

				const stmo = this.getArgumentObjectAt(args, 0);
				const char = this.getArgumentObjectAt(args, 1);

				this.typeAssertError("ARRAY", stmo, "at", "array");
				this.typeAssertError("NUMBER", char, "at", "array");

				return this.createToken(
					"NUMBER",
					Number(stmo?.value?.charCodeAt(char?.value)) || 0,
					this.getPositionObject()
				);
			},

			slice: (args) => {
				this.expectArguments(2, args, "slice", "array", true);

				const stmo = this.getArgumentObjectAt(args, 0);

				const si1 = this.getArgumentObjectAt(args, 1);
				const si2 =
					this.getArgumentObjectAt(args, 2) ||
					this.getTokenFrom(stmo?.value?.length);

				this.typeAssertError("ARRAY", stmo, "index", "array");
				this.typeAssertError("NUMBER", si1, "index", "array");
				this.typeAssertError("NUMBER", si2, "index", "array");

				return this.createToken(
					"STRING",
					stmo?.value.slice(si1?.value, si2?.value),
					this.getPositionObject()
				);
			},
		};

		for (let fname in stringFunctions) {
			this.createFunction("string::" + fname, stringFunctions[fname]);
		}
	}
};
