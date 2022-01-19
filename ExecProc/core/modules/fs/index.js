const fs = require("fs");
const Interface = require("../../interface");

module.exports = class FileSystem extends Interface {
    constructor(...args) {
        super(...args);

        // read and write
        this.createFunction("fs::read", (arg)=>{
            if (fs.existsSync(arg.value)) {
                const fileContent = fs.readFileSync(arg.value);
                return this.createToken("STRING", String(fileContent), this.getPositionObject());
            } else {
                throw new Error(`Cannot find file '${arg.value}' ${this.errorPosition()}`);
            }
        });
        this.createFunction("fs::write", (arg)=>{
            if (!fs.existsSync(arg[0].value) || arg[2]?.value == true) {
                fs.writeFileSync(arg[0].value, arg[1].value);
            } else {
                throw new Error(`Cannot overwrite file '${arg[0].value}' unless last argument is true ${this.errorPosition()}`);
            }
        });

        // exists
        this.createFunction("fs::exists", (arg)=>{
            return this.createToken("BOOLEAN", fs.existsSync(arg.value), this.getPositionObject());
        });
    }
}