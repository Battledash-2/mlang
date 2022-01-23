const Color = require("./color");
const Typeof = require("./typeof");
const Screen = require("./display_on_screen");

let createToken = (type, value, position)=>{type,value,position}

module.exports = (ct)=>{
	createToken = ct ?? createToken;

    let num = 0;
    return { // predefine functions an variables here (note: these can be overwritting by the user, although they cannot create functions)
        "util.pi": {
			value: Math.PI,
			constant: true
		},
        "util.enum": (_arg, _pos, caller)=>{return createToken("NUMBER", ++num, caller.position);},
        "util.log": (arg)=>console.log(Screen(arg?.map?.(c=>c?.value).join(" ") || (arg?.value || ""), true)),
		"print": (arg)=>console.log(Screen(arg?.map?.(c=>c?.value).join(" ") || (arg?.value || ""), true)),
        "printf": (arg)=>{
			arg.value = typeof arg.value == "string" ? arg.value : Screen(arg.value);
			let send = "";
			if (((arg?.value ? 1 : arg?.length) || 0) > 1) {
				send = arg.map(c=>Typeof(c.value) != "STRING" ? Color(c) : c?.value).join(" ");
			} else {
				send = Typeof(arg?.value) != "STRING" ? Color(arg) : arg?.value;
			}

			console.log(send);
		},
        "util.sin": (arg, pos)=>createToken("NUMBER", Math.sin(arg.value), pos.position),
        "util.cosin": (arg, pos)=>createToken("NUMBER", Math.cos(arg.value), pos.position),
		"util.len": (arg, pos)=>createToken("NUMBER", arg.value.length, pos.position),
        "util.strlen": (arg, pos)=>createToken("NUMBER", String(arg.value).length, pos.position),
        "util.has": (args, pos)=>createToken("BOOLEAN", args[0].value.includes(args[1].value), pos.position),
        "util.typeof": (arg, _pos, caller)=>createToken("STRING", arg?.type ?? "NULL", caller?.position),

		"NULL": (_arg, _pos, caller)=>createToken("NULL", "", caller?.position),
        // ...require("./convert")(createToken)
    }
};