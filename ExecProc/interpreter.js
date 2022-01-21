const fs = require("fs");
const path = require("path");
const Tokenizer = require("./tokenizer");
const Parser = require("./parser");

const conversions = require("./core/convert");

const operations = {
	"^": (l, r) => l ** r,

	"*": (l, r) => l * r,
	"/": (l, r) => l / r,

	"+": (l, r) => l + r,
	"-": (l, r) => l - r,
};

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
	constructor(ast, fn, fp, returnExports = false) {
		this.fn = fn;
		this.fp = fp;

		this.variables = require("./core/main")(this.createToken);
		this.userFunctions = {}; // functions defined by user
		this.userConversions = {};
		this.exports = {};
		this.returnExports = returnExports;
		this.pos;

		this.assignOperations = {
			// assignOperations[operator](variable, operation);
			"+=": (v, o) => {this.variables[v] += o;},
			"-=": (v, o) => {this.variables[v] -= o;},

			"%=": (v, o) => {this.variables[v] %= o;},
			"*=": (v, o) => {this.variables[v] *= o;},

			"^=": (v, o) => {this.variables[v] **= o;},

            "=": (v, o) => {this.variables[v] = o;}
		};

		return this.start(ast.body);
	}

	implement(m) {
		return new m(this);
	}

	createToken(type, value, position) {
		return {
			type,
			value,
			position,
		};
	}

	getVar(name, withError=true) {
		if (this.varExists(name)) {
			return this.variables[name];
		}
		if (withError) throw new Error(`Attempted to GET an uninitialized variable: '${name}' (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`);
	}

	deleteVar(name, withError=true) {
		if (this.varExists(name)) {
			delete this.variables[name];
			return null;
		}
		if (withError)
			throw new Error(
				`Attempted to DELETE an uninitialized variable: '${name}' (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
			);
	}

	varExists(name) {
		return this.variables[name] == null ? false : true;
	}

	createVar(value, name, internal = false) {
		if (
			!internal &&
			name.startsWith("$") &&
			!name.startsWith("$last") &&
			!name.startsWith("$pid")
		) {
			throw new Error(
				`Variable names beginning with '$' are reserved for pointers. (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
			);
		}
		if (!internal && name.includes("::")) {
			throw new Error(
				`Variables names with '::' are restricted for modules only. (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
			);
		}
		this.variables["util.last"] = value;
		if (!this.variables["$last"]) {
			this.setPointer("last", name);
		}
		this.variables[name] = value;
	}

	setPointer(pointer, name) {
		Object.defineProperty(this.variables, "$" + pointer, {
			configurable: true,
			get() {
				return this[name];
			},
			set(value) {
				this[name] = value;
			},
		});
	}
	deletePointer(pointer) {
		delete this.variables["$" + pointer];
	}

	execConvert(fname, arg) {
		if (this.userConversions[fname]) {
			this.createVar(arg?.value, "util.arg");
			const result = this.start(this.userConversions[fname])[0] || null;
			this.deleteVar("util.arg", false);
			return result;
		}
		throw new Error(
			`Attempted to GET an uninitialized function: '${fname}' (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
		);
	}

	start(node) {
		let r = [];
		for (let o in node) {
			const add = this.loop(node[o]);
			if (add == null) continue;
			r.push(add);
		}
		if (this.returnExports) {
			return this.exports;
		} else {
			return r;
		}
	}

	execFunc(fname, arg, idname) {
		if (this.userFunctions[fname]) {
			if (Array.isArray(arg)) {
				for (let pos in arg) {
					let cur = arg[pos];
					let posi = pos == 0 ? "" : String(pos);

					this.createVar(cur.value, "util.arg" + posi);
					if (cur.type == "IDENTIFIER") {
						this.setPointer("pid" + posi, cur.value);
					}
				}
			} else {
				this.createVar(arg?.value, "util.arg");
				if (arg?.type == "IDENTIFIER") {
					this.setPointer("pid", idname);
				}
			}

			const result = this.start(this.userFunctions[fname])[0] || null;

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
			return result;
		}
		throw new Error(
			`Attempted to GET an uninitialized function: '${fname}' (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`
		);
	}

	importFile(node) {
		const fileContent = fs.readFileSync(node?.file);
		const filename = node?.file;
		const module_name = filename.split(".", 1)[0];

		const tokens = new Tokenizer(fileContent, filename, filename);
		const ast = new Parser(tokens, filename, filename);
		const exports = new Interpreter(ast, filename, filename, true);

		Object.entries(exports).forEach(([name, value]) => {
			if (value.type === "DEFINEF") {
				this.userFunctions[module_name + "::" + name] = value.body;
			} else {
				this.variables[module_name + "::" + name] = value.value;
			}
		});
	}

	fcall(node) {
		const fname = node.name.value;
		let idname, arg;
		if (node.arg && node.arg.type == "IDENTIFIER") {
			idname = node.arg.value;
		}

		if (Array.isArray(node.arg)) {
			arg = node.arg;
		} else {
			arg = node.arg != null ? this.loop(node.arg) : node.arg;
		}

		if (typeof this.getVar(fname, false) == "function") {
			return this.getVar(fname)(arg, node.arg, node);
		} else {
			return this.execFunc(fname, arg, idname /*node.arg, node*/);
		}
	}

	assign(variable, operation, operator) {
		if (!operation.hasOwnProperty("left")) {
			operation = operation?.value;
		} else {
			operation = this.evaluate(
				this.loop(operation?.left),
				this.loop(operation?.right),
				operation.operator
			);
		}
		this.assignOperations[operator](variable.value, operation);
		return null;
	}

	evaluate({ value: l }, { value: r }, operator, eou=true) {
		if (operator != null) {
			if (l.type == "IDENTIFIER") {
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

	loop(node, errorOnUndefined=true) {
		if (node?.type == "DEFINITION") {
			this.pos = node;
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
					node.name
				);
			} else if (node.value.type == "IDENTIFIER") {
				this.createVar(this.getVar(node.value.value), node.name);
			} else if (node.value.type == "FCALL") {
				this.createVar(
					this.loop(this.fcall(node.value))?.value,
					node.name
				);
			} else {
				this.createVar(this.loop(node.value).value, node.name);
			}
			return null;
		}

		if (node?.type == "IDENTIFIER") {
			this.pos = node;
			let value;
			if (this.userFunctions.hasOwnProperty(node.value)) {
				value = {
					type: "DEFINEF",
					body: {
						type: "BLOCK",
						body: this.userFunctions[node.value],
					},
					position: this.pos.position,
				};
			} else {
				value = this.getVar(node.value, errorOnUndefined);
			}
			return {
				type: node.type,
				value: value,
				position: node.position,
			};
		}

		if (node?.type == "FCALL") {
			this.pos = node;
			return this.fcall(node);
		}

		if (node?.type == "CONVERT") {
			this.pos = node;
			if (
				this.userConversions.hasOwnProperty(
					`${node.from?.value}-${node.to?.value}`
				)
			) {
				return this.execConvert(
					`${node.from?.value}-${node.to?.value}`,
					this.loop(node.value)
				);
			} else if (
				conversions.hasOwnProperty(
					`${node.from?.value}-${node.to?.value}`
				)
			) {
				return {
					type: "NUMBER",
					value: conversions[`${node.from?.value}-${node.to?.value}`](
						this.loop(node.value)
					),
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
			if (fs.existsSync(node?.file)) {
				this.importFile(node);
			} else if (fs.existsSync(path.join(__dirname, node?.file))) {
				const userModule = require(path.join(__dirname, node?.file));
				this.implement(userModule);
			} else if (fs.existsSync(path.join(__dirname, "core", "modules", node?.file))) {
				const coreModule = require(path.join(
					__dirname,
					"core",
					"modules",
					node?.file
				));
				this.implement(coreModule);
			} else {
				throw new Error(`Attempt to import a non-existent file '${node?.file}' (${this.fn}:${this.pos.position.line}:${this.pos.position.cursor})`);
			}
			return null;
		}

		if (node?.type == "EXPORT") {
			let exportName = node.name;
			if (!this.variables.hasOwnProperty(exportName)) {
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
			if (node?.condition?.left) {
				if (
					this.evaluate(
						this.loop(node?.condition?.left, false),
						this.loop(node?.condition?.right, false),
						node?.condition?.operator,
						false
					)
				) {
					return this.start(node?.pass?.body)[0] || null;
				} else if (node?.fail?.body != null) {
					return this.start(node?.fail?.body)[0] || null;
				}
			} else {
				if (
					this.varExists(node?.condition?.value) ||
					node?.condition?.value > 0 ||
					node?.condition?.value == true
				) {
					return this.start(node?.pass?.body)[0] || null;
				} else if (node?.fail?.body != null) {
					return this.start(node?.fail?.body)[0] || null;
				}
			}
			return null;
		}

		if (node?.type == "ASSIGN") {
			if (this.varExists(node?.variable?.value)) {
				return this.assign(
					node?.variable,
					node?.operation,
					node?.operator);
			} else {
				throw new Error(`Cannot assign variable '${node?.variable?.value}' without 'let' or 'var' keyword (${this.fn}:${this.pos?.position?.line}:${this.pos?.position?.cursor})`);
			}
		}

		if (node?.value != null) {
			this.pos = node;
			return node;
		}

		if (node != null) this.pos = node;

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
