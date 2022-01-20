module.exports = (createToken)=>{
    let num = 0;
    return { // predefine functions an variables here (note: these can be overwritting by the user, although they cannot create functions)
        "util.pi": Math.PI,
        "util.enum": (_arg, _pos, caller)=>{return createToken("NUMBER", ++num, caller.position);},
        "util.log": (arg)=>console.log(arg.value),
        "print": (arg)=>console.log(arg.value),
        "util.sin": (arg, pos)=>createToken("NUMBER", Math.sin(arg.value), pos.position),
        "util.cosin": (arg, pos)=>createToken("NUMBER", Math.cos(arg.value), pos.position),
        "util.len": (arg, pos)=>createToken("NUMBER", String(arg.value).length, pos.position),
        "util.has": (args, pos)=>createToken("BOOLEAN", args[0].value.includes(args[1].value), pos.position),
        "util.typeof": (arg, pos)=>createToken("STRING", arg.type, pos.position),
        // ...require("./convert")(createToken)
    }
};