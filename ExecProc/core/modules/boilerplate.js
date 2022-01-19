const Interface = require("<path-to-interface>");

module.exports = class <module-name> extends Interface {
    constructor(...args) {
        super(...args);

        // use `this.createFunction` or other functions here (see full list in <path-to-interface>)
        this.createFunction("module-name::my-function-name", (arg)=>{
            if (Array.isArray(arg)) {
                console.log("Multiple arguments", arg[0].value);
            } else if (arg != null) {
                console.log("Single argument", arg.value);
            }
            return this.createToken("TYPE", "VALUE", this.getPositionObject());
        });
    }
}