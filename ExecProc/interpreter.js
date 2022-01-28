const fs = require("fs");
const path = require("path");

const Scope = require("./scope");

const Tokenizer = require("./tokenizer");
const Parser = require("./parser");

const Typeof = require("./core/typeof");

const operations = {
	"^": (l, r) => l ** r,

	"*": (l, r) => l * r,
	"/": (l, r) => l / r,

	"+": (l, r) => l + r,
	"-": (l, r) => l - r,
}
const binOperations = {
	"==": (l, r) => l == r,
	"===": (l, r) => l === r,

	"!=": (l, r) => l != r,
	"!==": (l, r) => l !== r,

	"&&": (l, r) => l && r,
	"||": (l, r) => l || r,

	">=": (l, r) => l >= r,
	"<=": (l, r) => l <= r,
	">": (l, r) => l > r,
	"<": (l, r) => l < r,
};

module.exports = class Interpreter {
	constructor(ast, fn, fp, returnExports=false, scope, functions, conversions, strictMode=false) {
		this.fn = fn;
		this.fp = fp;

		this.strictMode = strictMode ?? false;

		this.global = require("./core/main")(fn);
		this.local = scope ?? new Scope(this.global);

		this.local.useStrict = ()=>{
			this.strictMode = true;
		}

		this.userFunctions = functions ?? {}; // functions defined by user
		this.userConversions = conversions ?? {};

		this.exports = {};
		this.returnExports = returnExports;

		this.pos = {
			position: {
				line: 1,
				cursor: 1
			}
		};

		this.conversions = require("./core/convert");

		this.assignOperations = {
			"+=": (v, o) => {this.local[v].value += o;},
			"-=": (v, o) => {this.local[v].value -= o;},

			"%=": (v, o) => {this.local[v].value %= o;},
			"*=": (v, o) => {this.local[v].value *= o;},

			"^=": (v, o) => {this.local[v].value **= o;},

			"=": (v, o) => {this.local[v].value = o;},
		};

		return this.start(ast.body, false);
	}

	implement(m) {
		return new m(this);
	}

	static createToken(type,value,position) {return {type,value,position}}

	createToken(type, value, position) {
		return {
			type,
			value,
			position,
		};
	}

	getVar(name, withError = true) {
		if (this.varExists(name)) {
			return this.local[name]?.value ?? (this.local[this.local[name]?.ref]?.value ?? this.local[name]);
		}
		if (withError) throw new Error(`Attempted to GET an uninitialized variable: '${name}' (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`);
	}

	deleteVar(name, withError = true) {
		if (this.varExists(name)) {
			delete this.local[name];
			return null;
		}
		if (withError)
			throw new Error(
				`Attempted to DELETE an uninitialized variable: '${name}' (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
			);
	}

	varExists(name) {
		return this.local[name] == null ? false : true;
	}

	createVar(value, name, internal = false, constant=false) {
		if (!internal && name.startsWith("$") && !name.startsWith("$last") && !name.startsWith("$pid")) {
			throw new Error(
				`Variable names beginning with '$' are reserved for pointers. (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
			);
		}
		if (!internal && name.includes("::")) {
			throw new Error(
				`Variables names with '::' are restricted for modules and imports only. (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
			);
		}
		
		if (this.local.hasOwnProperty(name) && this.local[name]?.constant == true) throw new Error(`Attempt to overwrite a constant variable '${name}' (${this.fn}:${this.pos?.position?.line ?? 0}:${this.pos?.position?.cursor ?? 0})`);

		if (name.startsWith("$")) {
			this.local[this.local[name]?.ref].value = value;
			return null;
		}

		this.local["util.last"] = {
			constant,
			value
		};
		if (!this.local.hasOwnProperty("$last")) this.setPointer("last", name);
		this.local[name] = {
			constant,
			value
		};
	}

	setPointer(pointer, name) {
		this.local["$"+pointer] = {
			ref: name,
			constant: false
		}
	}
	deletePointer(pointer) {
		delete this.local["$" + pointer];
	}

	execConvert(fname, arg) {
		if (this.userConversions[fname]) {
			this.local = new Scope(this.local);

			this.createVar(arg?.value, "util.arg", true);
			const result = this.start(this.userConversions[fname], false).output[0] || null;
			this.deleteVar("util.arg", false);

			this.local = this.local["%PAR"];
			return result;
		}
		throw new Error(
			`Attempted to GET an uninitialized function: '${fname}' (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
		);
	}

	looseVar(varName, err = true) {
		if (this.userFunctions.hasOwnProperty(varName)) return varName;
		return this.getVar(varName, err);
	}

	start(node, newScope=true) {
		if (newScope === true) this.local = new Scope(this.local);

		let r = [];
		for (let o in node) {
			const add = this.loop(node[o]);
			if (add == null) continue;
			if (add?.type == "BREAK") {
				r.push({
					type: add?.type,
					position: add?.position,
				});
				break;
			}
			r.push(add);
		}

		if (newScope === true) this.local = this.local["%PAR"];
		if (this.returnExports) {
			return this.exports;
		} else {
			return {
				output: r,
				strict: this.strictMode,
				scope: this.local,
				functions: this.userFunctions,
				conversions: this.conversions
			};
		}
	}

	execFunc(fname, arg) {
		if (this.userFunctions[fname]) {
			this.local = new Scope(this.local);

			if (Array.isArray(arg)) {
				for (let pos in arg) {
					let cur = arg[pos];
					let posi = pos == 0 ? "" : String(pos);

					this.createVar(cur.value, "util.arg" + posi, false, false);
					if (cur.type == "IDENTIFIER") {
						this.setPointer("pid" + posi, cur.value);
					}
				}
			} else {
				this.createVar(arg?.value, "util.arg");
				if (arg?.type == "IDENTIFIER") {
					this.setPointer("pid", arg?.name);
				}
			}

			const result = this.start(this.userFunctions[fname], false).output[0] || null;

			if (Array.isArray(arg)) {
				for (let pos in arg) {
					let cur = arg[pos];
					let posi = pos == 0 ? "" : String(pos);

					this.deleteVar("util.arg" + posi, false);
					if (cur.type == "IDENTIFIER") {
						this.deletePointer("pid" + posi);
					}
				}
			} else {
				this.deleteVar("util.arg", false);
				if (arg?.type == "IDENTIFIER") {
					this.deletePointer("pid");
				}
			}

			this.local = this.local["%PAR"];

			return result;
		}
		throw new Error(
			`Attempted to GET an uninitialized function: '${fname}' (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
		);
	}

	importFile(node) {
		const fileContent = fs.readFileSync(node?.file);
		const fileName = node?.file;
		const moduleName = fileName.split("/").slice(-1)[0].split(".", 1)[0];

		const tokens = new Tokenizer(fileContent, fileName, fileName);
		const ast = new Parser(tokens, fileName, fileName);
		const exported = new Interpreter(ast, fileName, fileName, true);

		Object.entries(exported).forEach(([name, value]) => {
			if (value.type === "DEFINEF") {
				this.userFunctions[moduleName + "::" + name] = value.body;
			} else {
				this.local[moduleName + "::" + name] = value.value;
			}
		});
	}

	fcall(node) {
		const fname = node.name.value;
		let arg;

		if (Array.isArray(node.arg)) {
			arg = node.arg.map((c) => {
				if (c.type == "IDENTIFIER") {
					return {
						type: c.type,
						name: c.value,
						value: this.looseVar(c.value),
						position: c.position,
					};
				}
				return this.loop(c);
			});
		} else {
			arg = node.arg != null ? this.loop(node.arg) : node.arg;
		}

		if (typeof this.getVar(fname, false) == "function") {
			let rv = this.getVar(fname)(arg, node.arg, node);
			return rv;
		} else {
			return this.execFunc(fname, arg /*node.arg, node*/);
		}
	}

	assign(variable, operation, operator) {
		if (this.local.hasOwnProperty(variable.value) && this.local[variable.value].constant == true) throw new Error(`Attempt to overwrite a constant variable '${variable.value}' (${this.fn}:${this.pos?.position?.line ?? 0}:${this.pos?.position?.cursor ?? 0})`);
		if (!operation.hasOwnProperty("left")) {
			operation = this.loop(operation)?.value;
		} else {
			operation = this.evaluate(
				this.loop(operation?.left),
				this.loop(operation?.right),
				operation.operator
			);
		}

		if (variable.value.startsWith("$")) {
			// this.local[this.local[name]?.ref] = value;
			this.assignOperations[operator](this.local[variable.value]?.ref, operation);
			return null;
		}

		this.assignOperations[operator](variable.value, operation);
		return null;
	}

	evaluate({ value: l }, { value: r }, operator, eou = true) {
		if (operator != null) {
			if (l?.type == "IDENTIFIER") {
				l = this.getVar(l.value, eou);
			}
			if (r?.type == "IDENTIFIER") {
				r = this.getVar(r.value, eou);
			}

			if (operations[operator]) return operations[operator](l, r);
			if (binOperations[operator]) return binOperations[operator](l, r);

			throw new Error(
				`Could not find operator '${operator}' internally (${this.fn}:${this.pos.position.line}:${this.pos.position.cursor})`
			);
		}
	}

	conditionPass(node) {
		if (node?.left) {
			if (
				this.evaluate(
					this.loop(node?.left, false),
					this.loop(node?.right, false),
					node?.operator,
					false
				)
			) {
				return true;
			} else {
				return false;
			}
		} else {
			if ((this.varExists(node?.value) || node?.value) || (node?.value == true || this.getVar(node?.value, false) == true)) {
				return true;
			} else {
				return false;
			}
		}
		return false;
	}

	condition(node) {
		if (node?.condition?.left) {
			if (
				this.evaluate(
					this.loop(node?.condition?.left, false),
					this.loop(node?.condition?.right, false),
					node?.condition?.operator,
					false
				)
			) {
				return this.start(node?.pass?.body).output[0] || null;
			} else if (node?.fail?.body != null) {
				return this.start(node?.fail?.body).output[0] || null;
			}
		} else {
			if ((this.varExists(node?.condition?.value) || node?.condition) || (node?.condition?.value == true || this.getVar(node?.condition?.value, false) == true)) {
				return this.start(node?.pass?.body).output[0] || null;
			} else if (node?.fail?.body != null) {
				return this.start(node?.fail?.body).output[0] || null;
			}
		}
		return null;
	}

	loop(node, errorOnUndefined = true) {
		if (node?.type == "BREAK") {
			return {
				type: "BREAK",
				position: node?.position,
			};
		}

		if (node?.type == "ARRAY") {
			node.values = node?.values ?? node?.value;
			let vals;
			if (typeof node?.values[0] == "undefined") {
				vals = [];
			} else {
				vals = node?.values.map?.((c) => this.loop(c));
			}
			return {
				type: "ARRAY",
				value: vals,
				position: node?.position,
			};
		}

		if (node?.type == "DEFINITION") {
			this.pos = node;

			const isConst = node?.kind == "const" ? true : false;

			if (this.userFunctions.hasOwnProperty(node.name)) {
				delete this.userFunctions[node.name];
			}
			if (node.value.left) {
				this.createVar(
					this.evaluate(
						this.loop(node.value.left),
						this.loop(node.value.right),
						node.value.operator
					),
					node.name,
					false,
					isConst
				);
			} else if (node.value.type == "IDENTIFIER") {
				this.createVar(this.getVar(node.value.value), node.name, false, isConst);
			} else if (node.value.type == "FCALL") {
				this.createVar(
					this.loop(this.fcall(node.value))?.value,
					node.name,
					false,
					isConst
				);
			} else {
				this.createVar(this.loop(node.value).value, node.name, false, isConst);
			}
			return null;
		}

		if (node?.type == "IDENTIFIER") {
			this.pos = node;

			let value = node?.name ?? node?.value;
			if (!this.userFunctions.hasOwnProperty(value)) {
				value = this.getVar(value, errorOnUndefined);
			}

			return {
				type: node.type,
				value: value,
				valueType: Typeof(value) || null,
				name: node.value,
				position: node.position,
			};
		}

		if (node?.type == "FCALL") {
			this.pos = node;
			return this.fcall(node);
		}

		if (node?.type == "CONVERT") {
			this.pos = node;
			if (this.userConversions.hasOwnProperty(`${node.from?.value}-${node.to?.value}`)) {
				return this.execConvert(
					`${node.from?.value}-${node.to?.value}`,
					this.loop(node.value)
				);
			} else if (this.conversions.hasOwnProperty(`${node.from?.value}-${node.to?.value}`)) {
				return {
					type: "NUMBER",
					value: this.conversions[
						`${node.from?.value}-${node.to?.value}`
					](this.loop(node.value)),
					position: node?.position,
				};
			} else {
				throw new Error(
					`Unknown unit '${node.from?.value}-${node.to?.value}' or not yet supported (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
				);
			}
		}

		if (node?.type == "DEFINEF") {
			// this.userFunctions
			this.pos = node;

			const fname = node?.name?.value;
			if (fname.includes("::")) {
				throw new Error(
					`Variables names with '::' are restricted for modules only. (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
				);
			}
			const fbody = node?.body?.body;
			this.userFunctions[fname] = fbody;

			return null;
		}

		if (node?.type == "DEFINEC") {
			// this.userFunctions
			let fname = node?.name[0]?.value + "-" + node?.name[1]?.value;
			const fbody = node?.body?.body;
			this.userConversions[fname] = fbody;

			return null;
		}

		if (node?.type == "IMPORT") {
			this.pos = node;
			if (!node?.file?.endsWith(".js") && fs.existsSync(node?.file)) {
				this.importFile(node);
			} else if (fs.existsSync(node?.file)) {
				let p = this.fp
					.replace(/\\/g, "/")
					.split("/")
					.map((c) => (c == "" ? "/" : c));
				p.pop();
				const userModule = require(path.join(...p, node?.file));
				this.implement(userModule);
			} else if (
				fs.existsSync(
					path.join(__dirname, "core", "modules", node?.file)
				)
			) {
				const coreModule = require(path.join(
					__dirname,
					"core",
					"modules",
					node?.file
				));
				this.implement(coreModule);
			} else {
				throw new Error(
					`Attempt to import a non-existent file '${node?.file}' (${this.fn}:${this.pos.position.line}:${this.pos.position.cursor})`
				);
			}
			return null;
		}

		if (node?.type == "EXPORT") {
			let exportName = node.name;
			if (!this.local.hasOwnProperty(exportName)) {
				this.exports[exportName] = {
					type: "DEFINEF",
					body: this.userFunctions[exportName],
				};
			} else {
				this.exports[exportName] = {
					type: "VARIABLE",
					value: this.getVar(exportName, false),
				};
			}
			return null;
		}
		if (node?.type == "UNARY") {
			this.pos = node;

			return {
				type: "NUMBER",
				value: Number(
					node?.operator + Math.abs(this.loop(node?.value).value)
				),
				position: node?.position,
			};
		}

		if (node?.type == "CONDITION") {
			return this.condition(node);
		}

		if (node?.type == "ASSIGN") {
			if (this.varExists(node?.variable?.value)) {
				return this.assign(
					node?.variable,
					node?.operation,
					node?.operator
				);
			} else {
				if (node?.variable?.type == "ARRAY_SELECT") {
					const arr = this.getVar(node?.variable?.array?.value); // javascript objects / arrays are pointers :)
					
					if (this.loop(node?.operation)?.type == "DELETE") {
						arr.splice(this.loop(node?.variable?.goto)?.value, 1);

						return null;
					}

					let append = this.loop(node?.operation) ?? {};
					append.type = append?.valueType ?? append?.type;
					
					if (arr[this.loop(node?.variable?.goto)?.value] != null) {
						arr[this.loop(node?.variable?.goto)?.value] = append;
					} else {
						this.getVar(node?.variable?.array?.value).push(append);
					}
					return null;
				} else if(this.strictMode) {
					throw new Error(
						`Cannot assign variable '${node?.variable?.value}' without 'let', 'var' or 'const' keyword (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
					);
				} else {
					this.createVar(
						this.loop(node?.operation).value,
						node?.variable?.value,
						false,
						false
					);
					return null;
				}
			}
		}

		if (node?.type == "LOOP") {
			const dec = node?.operation?.declarations;
			const sta = node?.operation?.statement;

			const dow = node?.body;

			this.local = new Scope(this.local);

			this.start(dec, false);
			while (this.conditionPass(sta)) {
				if (this.start(dow?.body, false).output[0]?.type == "BREAK") break;
			}

			this.local = this.local["%PAR"];
			return null;
		}

		if (node?.type == "ARRAY_SELECT") {
			const pos = this.loop(node?.goto).value;
			let arr;
			if (node?.array?.type == "FCALL") {
				const result = this.fcall(node?.array);
				arr = result?.values ?? result?.value;
			} else {
				arr = this.loop(node?.array).value;
			}

			if (pos in arr) {
				const res = this.loop(arr[pos]);
				return res?.hasOwnProperty("type") ? res : {type:"NULL",value:""};
			} else {
				return null;
			}
		}

		if (node?.type == "Empty") {
			return null;
		}

		if (node?.value != null) {
			this.pos = node;
			return node;
		}

		if (node != null) this.pos = node;
		if (!node?.hasOwnProperty("type")) {
			return {};
		}

		return {
			type: node.type,
			value: this.evaluate(
				this.loop(node.left, errorOnUndefined),
				this.loop(node.right, errorOnUndefined),
				node.operator, // this could be `null`
				errorOnUndefined
			),
			position: node.position,
		};
	}
};
