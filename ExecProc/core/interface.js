module.exports = class InterpreterInterface {
    constructor(interpreter) {
        this.interface = interpreter;
    }

	// Functional
	pauseProcess(ms=0) {
		const end = Date.now() + ms;
		while (Date.now() < end) continue;
		return true;
	}
	throwError(error, functionName, moduleName) {
		throw new Error(`${error} in ${moduleName}/${functionName} ${this.errorPosition()}`);
	}

	// Imports
	importFile(file) {
		return this.interface.importFile({ file });
	}
	importFromText(value, as="_") {
		const tokens = new Tokenizer(value, "import", "import");
		const ast = new Parser(tokens, "import", "import");
		const exported = new Interpreter(ast, "import", "import", true);

		Object.entries(exported).forEach(([ name, value ]) => {
			if (value.type === "DEFINEF") {
				this.userFunctions[as + "::" + name] = value.body;
			} else {
				this.variables[as + "::" + name] = value.value;
			}
		});
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

    // Arguments
    argumentsLength(args) {
		return (args?.value ? 1 : args?.length) || 0;
    }
	createArgumentList(args) {
		return [...args.map(c=>this.getTokenFrom(c))];
	}
	getArgumentValues(args) {
		return args?.map?.(c=>c?.value) || [];
	}
	concatValues(args, sep=" ") {
		return args?.map?.(c=>c?.value).join(sep) || (args?.value || "");
	}

	// Functions
	isUserFunction(arg) {
		return this.interface?.userFunctions[arg] != null;
	}
	isBuiltInFunction(arg) {
		return typeof this.interface?.variables[arg] == "function";
	}
	isFunction(arg) {
		return this.isUserFunction(arg) || this.isBuiltInFunction(arg);
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
    createConversion(from="", to="", callback=(arg={value:""})=>{return false;}) {
        this.interface.conversions[`${from}-${to}`] = callback;
    }
    deleteConversion(from="", to="") {
        delete this.interface.conversions[`${from}-${to}`];
    }
    executeConversion(value=0, from="", to="") {
        if (this.interface.userConversions.hasOwnProperty(`${node.from?.value}-${node.to?.value}`)){
            return this.interface.execConvert(`${from}-${to}`, this.interface.loop(value))
        } else if (this.interface.conversions.hasOwnProperty(`${from}-${to}`)) {
            return {
                type: "NUMBER",
                value: this.interface.conversions[`${from}-${to}`](this.loop(value)),
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