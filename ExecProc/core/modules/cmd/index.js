const Interface = require("../../interface");

module.exports = class TerminalUtilities extends Interface {
    constructor(...args) {
        super(...args);

        // STDOUT
        this.createFunction("cmd::write", (arg)=>{process.stdout.write(arg.value);});

        // Font styles (like bold, italic and underline)
        this.createFunction("cmd::dim", (arg)=>this.createToken("STRING", "\u001b[2m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::underline", (arg)=>this.createToken("STRING", "\u001b[4m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::strike", (arg)=>this.createToken("STRING", "\u001b[9m" + arg.value, this.getPositionObject()));    

        // Colors
        this.createFunction("cmd::reset", (arg={})=>{
            if (!arg.hasOwnProperty("value")) {
                arg.value = "";
            }
            return this.createToken("STRING", "\u001b[0m" + arg?.value, this.getPositionObject());
        });
        this.createFunction("cmd::bold", (arg)=>this.createToken("STRING", "\u001b[1m" + arg.value, this.getPositionObject()));
        this.createFunction("cmd::black", (arg)=>this.createToken("STRING", "\u001b[30m" + arg.value, this.getPositionObject()));
        this.createFunction("cmd::red", (arg)=>this.createToken("STRING", "\u001b[31m" + arg.value, this.getPositionObject()));
        this.createFunction("cmd::green", (arg)=>this.createToken("STRING", "\u001b[32m" + arg.value, this.getPositionObject()));
        this.createFunction("cmd::yellow", (arg)=>this.createToken("STRING", "\u001b[33m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::blue", (arg)=>this.createToken("STRING", "\u001b[34m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::magenta", (arg)=>this.createToken("STRING", "\u001b[35m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::cyan", (arg)=>this.createToken("STRING", "\u001b[36m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::white", (arg)=>this.createToken("STRING", "\u001b[37m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::gray", (arg)=>this.createToken("STRING", "\u001b[90m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::brightRed", (arg)=>this.createToken("STRING", "\u001b[91m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::brightGreen", (arg)=>this.createToken("STRING", "\u001b[92m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::brightYellow", (arg)=>this.createToken("STRING", "\u001b[93m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::brightBlue", (arg)=>this.createToken("STRING", "\u001b[94m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::brightMagenta", (arg)=>this.createToken("STRING", "\u001b[95m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::brightCyan", (arg)=>this.createToken("STRING", "\u001b[96m" + arg.value, this.getPositionObject()));    
        this.createFunction("cmd::brightWhite", (arg)=>this.createToken("STRING", "\u001b[97m" + arg.value, this.getPositionObject()));    

        const rgbFunc = (args)=>{
            let rgb = [];
            if (!Array.isArray(args)) throw new Error(`'cmd/rgb' expects 3 arguments ${this.errorPosition()}`);
            let str = args.shift();
            if (str?.type != "STRING") throw new Error(`First argument of 'cmd/rgb' is expected to be a string ${this.errorPosition()}`);
            for (let v of args) {
                if (v?.type != "NUMBER" && parseInt(v.value) == NaN) throw new Error(`Arguments in 'cmd/rgb' can only be numbers ${this.errorPosition()}`);
                if ((v?.value > 255 || parseInt(v?.value) > 255) || (v?.value < 0 || parseInt(v?.value) < 0)) throw new Error(`'cmd/rgb' only accepts numbers between 0-255 ${this.errorPosition()}`);

                rgb.push(parseInt(v?.value));
            }
            return this.createToken(
                "STRING",
                `\u001b[38;2;${rgb.shift()};${rgb.shift()};${rgb.shift()}m${str?.value || ""}`,
                this.getPositionObject()
            );
        };
        this.createFunction("cmd::rgb", rgbFunc);
        this.createFunction("cmd::hex", (args)=>{
            const string = args.shift().value;
            const rgb = ((hex)=>{
                hex = hex.startsWith("#") ? hex.slice(1) : hex;
                hex = hex.length == 3 ? hex[0].repeat(2) + hex[1].repeat(2) + hex[2].repeat(2) : hex;
                hex = hex.match(/\w{2}/g).map(c=>parseInt(c, 16));
                return hex;
            })(args.shift().value);
            return rgbFunc([ // we could use `executeFunction` but it would be unoptimized
                {
                    type: "STRING",
                    value: string,
                    position: this.getPositionObject()
                },
                {
                    type: "NUMBER",
                    value: rgb.shift(),
                    position: this.getPositionObject()
                },
                {
                    type: "NUMBER",
                    value: rgb.shift(),
                    position: this.getPositionObject()
                },
                {
                    type: "NUMBER",
                    value: rgb.shift(),
                    position: this.getPositionObject()
                }
            ]);
        });
    }
}