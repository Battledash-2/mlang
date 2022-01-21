module.exports = class InterpreterInterface {
    constructor(interpreter) {
        this.interface = interpreter;
    }

    // For error logging
    errorPosition() {
        return `(${this.getFilename()}:${this.getPosition()})`;
    }
    getPosition() {
        return this.interface.pos?.position?.line + ":" + this.interface.pos?.position?.cursor;
    }
    getLine() {
        return this.interface.pos?.position?.line;
    }
    getCursor() {
        return this.interface.pos?.position?.cursor;
    }
    getFilename() {
        return this.interface.fn;
    }
    getPositionObject() {
        return this.interface.pos?.position;
    }

    // Arguments length
    argumentsLength(args) {
		return (args?.value ? 1 : args?.length) || 0;
    }

    // Variables
    createVariable(name="", value="") {
        this.interface.createVar(value, name, true);
    }
    deleteVariable(name="") {
        this.interface.deleteVar(name);
    }
    getVariable(name="") {
        return this.interface.getVar(name);
    }
    variableExists(name="") {
        return this.interface.varExists(name);
    }

    // Pointers
    createPseudoPointer(pointerName="", variableName="") {
        this.interface.setPointer(pointerName, variableName);
    }
    deletePseudoPointer(pointerName="") {
        this.interface.deletePointer(pointerName);
    }

    // Functions
    createFunction(name="", callback=(arg={value:""})=>{return false;}) {
        this.interface.variables[name] = callback;
    }
    executeFunction(name="", argument={type:"",value:0,position:{line:0,cursor:0}}) {
        return this.interface.fcall({
            name: {
                value: name
            },
            arg: argument
        });
    }

    // Conversions
    /**
     * TODO: Make this work
     */
    createConversion(from="", to="", callback=(arg={value:""})=>{return false;}) {
        conversions[`${from}-${to}`] = callback;
    }
    deleteConversion(from="", to="") {
        delete conversions[`${from}-${to}`];
    }
    executeConversion(value=0, from="", to="") {
        if (this.interface.userConversions.hasOwnProperty(`${node.from?.value}-${node.to?.value}`)){
            return this.interface.execConvert(`${from}-${to}`, this.interface.loop(value))
        } else if (conversions.hasOwnProperty(`${from}-${to}`)) {
            return {
                type: "NUMBER",
                value: conversions[`${from}-${to}`](this.loop(value)),
                position: {
                    cursor: "N/A",
                    line: "N/A"
                }
            }
        } else {
            throw new Error(`Unknown unit '${node.from?.value}-${node.to?.value}' or not yet supported (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`);
        }
    }

    // Tokens
    createToken(type="", value="", position={cursor:0,line:0}) {
        return this.interface.createToken(type, value, position);
    }
    getTokenFrom(value) { // not recommended
        return this.interface.createToken((typeof value).toString().toUpperCase(), value, this.interface.pos?.position);
    }
    getTokenTypeFrom(value) {
        return (typeof value).toString().toUpperCase();
    }
}