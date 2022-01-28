const Interface = require("./internal");
const Screen = require("./display_on_screen");
const Typeof = require("./typeof");

let createToken = (type, value, position)=>({type,value,position});

const format = {
	v: (v)=>v, // value
	
	l: (v)=>v.length, // length
	t: (v)=>Typeof(v), // type

	b: (v)=>"\u001b[1m"+v+"\u001b[0m", // bold
	i: (v)=>"\u001b[3m"+v+"\u001b[0m", // italic
	s: (v)=>"\u001b[9m"+v+"\u001b[0m", // strikethrough
	u: (v)=>"\u001b[4m"+v+"\u001b[0m", // underline
}

module.exports = (fn)=>{
	// createToken = ct ?? createToken;
	const handle = new Interface(fn);

	function form(args) {
		let str = handle.getArgumentObjectAt(args, 0);
		const pos = str.position;

		handle.expectArguments(1, args, "printf", "builtin", true, pos);
		
		const other = handle.getArgumentValues(args);
		other.shift();

		handle.typeAssertError("STRING", str, "printf", "builtin", pos);

		str = str?.value ?? "";
		let i = 0;
		do {
			let val = other[i];
			i++; 

			str = str.replace(/(?:(?<!\\))%[a-z]/, (match)=>{
				const operator = match.slice(1);

				if (format.hasOwnProperty(operator)) {
					if (typeof val == "undefined") handle.throwError("Saw operator without a value", "format", "builtin", pos);
					return format[operator](val);
				}

				handle.throwError("Unknown operator '%"+operator+"': Try using a '\\'", "format", "builtin", pos);
			});
		} while (i < other.length);

		str = str.replace(/(?:(?<!\\))%[a-z]/g, (match)=>{
			const operator = match.slice(1);

			if (format.hasOwnProperty(operator)) {
				if (typeof other.slice(-1)[0] == "undefined") handle.throwError("Saw operator without a value", "format", "builtin", pos);
				return format[operator](other.slice(-1)[0]);
			}

			handle.throwError("Unknown operator '%"+operator+"': Try using a '\\'", "format", "builtin", pos);
		});

		return Screen(str, true, false);
	}

	let num = 0;
	return { // predefine functions an variables here (note: these can be overwritting by the user, although they cannot create functions)
		"util.pi": {
			value: Math.PI,
			constant: true
		},
		"util.enum": (_arg, _pos, caller)=>{return createToken("NUMBER", ++num, caller.position);},
		"util.log": (arg)=>console.log(Screen(arg?.map?.(c=>c?.value) || (arg?.value || ""), true, false)),
		"print": (arg)=>console.log(Screen(arg?.map?.(c=>c?.value) || (arg?.value || ""), true, false)),
		"printf": (args)=>{
			// expectArguments(amount=1, args, functionName="N/A", moduleName="N/A", allowMore) {
			console.log(form(args));
		},
		"format": (args, pos)=>{
			return createToken("STRING", form(args), pos.position); // can also do handle.createToken
		},
		"util.sin": (arg, pos)=>createToken("NUMBER", Math.sin(arg.value), pos.position),
		"util.cosin": (arg, pos)=>createToken("NUMBER", Math.cos(arg.value), pos.position),
		"util.len": (arg, pos)=>createToken("NUMBER", arg.value.length, pos.position),
		"util.strlen": (arg, pos)=>{
			return createToken("NUMBER", String(arg.value).length, pos.position)
		},
		"util.has": (args, pos)=>createToken("BOOLEAN", args[0].value.includes(args[1].value), pos.position),
		"util.typeof": (arg, _pos, caller)=>createToken("STRING", arg?.type ?? "NULL", caller?.position),

		"NULL": (_arg, _pos, caller)=>createToken("NULL", "", caller?.position),
		"DEL": (_arg, _pos, caller)=>createToken("DELETE", "", caller.position),

		"util.argv": process.argv.map(c=>({type:"STRING",value:c,position:{line:0,cursor:0}})),

		"return": (arg, pos)=>createToken(arg?.valueType ?? arg?.type, arg.value, pos.position),
		// ...require("./convert")(createToken)
	}
};