const Typeof = require("../../typeof");
const Interface = require("../../interface");

module.exports = class Types extends Interface {
	constructor(...args) {
		super(...args);

		// basic
		this.createFunction("types::of", (args)=>{
			const obj = this.getArgumentObjectAt(args, 0) ?? {type:"NULL"};

			return this.createToken("STRING", obj.valueType ?? Typeof(obj.value) ?? obj.type, this.getPositionObject());
		});
		this.createFunction("types::dangerof", (args)=>{
			this.expectArguments(1, args, "of", "types", true);

			const obj = this.getArgumentObjectAt(args, 0);

			return this.createToken("STRING", obj.valueType ?? Typeof(obj.value), this.getPositionObject());
		});
		this.createFunction("types::realof", (args)=>{
			this.expectArguments(1, args, "of", "types", true);

			const obj = this.getArgumentObjectAt(args, 0);

			return this.createToken("STRING", obj.type, this.getPositionObject());
		});
		this.createFunction("types::create", (args)=>{
			this.expectArguments(2, args, "create", "types", true);

			const type = this.getArgumentObjectAt(args, 0);
			const val = this.getArgumentObjectAt(args, 1);

			this.typeAssertError("STRING", type, "create", "type");

			return this.createToken(type?.value, val?.value, this.getPositionObject());
		});

		// other
		this.createFunction("types::string", (args)=>{
			this.expectArguments(1, args, "string", "types", true);
			const value = this.getArgumentObjectAt(args, 0)?.value;
			return this.createToken("STRING", String(value), this.getPositionObject());
		});
		this.createFunction("types::number", (args)=>{
			this.expectArguments(1, args, "number", "types", true);
			const value = this.getArgumentObjectAt(args, 0)?.value;
			return this.createToken("NUMBER", Number(value), this.getPositionObject());
		});
		this.createFunction("types::boolean", (args)=>{
			this.expectArguments(1, args, "boolean", "types", true);
			const value = this.getArgumentObjectAt(args, 0);
			return this.createToken("BOOLEAN", Boolean(value)?.value, this.getPositionObject());
		});
		this.createFunction("types::array", (args)=>{
			this.expectArguments(1, args, "array", "types", true);
			if (!Array.isArray(args)) args = [args];
			return this.createToken("ARRAY", [...args], this.getPositionObject());
		});		
		this.createFunction("types::null", (_)=>{
			return this.createToken("NULL", "", this.getPositionObject());
		});

		this.createVariable("Null", this.createToken("NULL", "", {line: 0, cursor: 0}));
	}
}