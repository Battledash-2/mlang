const fs = require("fs");
const readline = require("readline");

const mode = process.argv[2];
const filename = process.argv[3]; // file or terminal / console
const debugMode = ((mode == "-c" ? process.argv[3] : process.argv[4]) == "--debug" ? true : false) ?? false;

const ExecProc = require("./ExecProc");
const Interpreter = require("./ExecProc/interpreter");

if (mode == null) {
	repl();
} else {
	if (mode.toLowerCase() == "-f") {
		file();
	} else if (mode.toLowerCase() == "-c") {
		repl();
	}
}

function file() {
	if (fs.existsSync(filename)) {
		// console.log(String(fs.readFileSync(filename)));
		const filecontent = String(fs.readFileSync(filename));
		const fn = filename.toLowerCase().startsWith("c:") ||
			filename.toLowerCase().startsWith("home") ||
			filename.toLowerCase().startsWith("~") ||
			filename.toLowerCase().startsWith("/")
				? filename
				: `${process.cwd()}\\${filename}`;
		if (debugMode) console.time("Execution took");
		const result = new ExecProc(
			filecontent,
			filename,
			fn
		);
		console.log(
			"Result execution process: " + JSON.stringify(result.output, null, 4)
		);
		if (debugMode) console.timeEnd("Execution took");
	} else {
		console.error(`File '${filename}' does not exist.`);
	}
}

function repl() {
	console.log(`MLang v${require("./package.json").version}
Copyright (c) 2022 Battledash-2 (& MLang)\n`);

	const interface = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const isExit = (text) => {
		text = text.toLowerCase();
		return (
			text == "exit" ||
			text == "cls" ||
			text == "clear" ||
			text.slice(1) == "exit" ||
			text.slice(1) == "cls" ||
			text.slice(1) == "exit"
		);
	};

	let replScope = {
		vars: require("./ExecProc/core/main")("runtime"),
		funcs: {},
		convs: {}
	}

	function ask() {
		interface.question(
			"\u001b[1;97mmlang \u001b[1;31m$ \u001b[0m",
			(response) => {
				if (isExit(response)) {
					interface.close();
					process.stdout.write("\033c"); // clears console
					return;
				}

				if (debugMode) console.time("Execution took");
				let result;
				try {
					result = new ExecProc(response, "runtime", "runtime", replScope.vars, replScope.funcs, replScope.convs, replScope.strict);
					replScope["vars"] = result.scope;
					replScope["funcs"] = result.functions;
					replScope["convs"] = result.conversions;
					replScope["strict"] = result.strict;
					console.log(
						result.output[0] == null
							? "\u001b[1;35mundefined\u001b[0m"
							: result.output[0]?.type == "STRING"
							? `\u001b[92m"${result.output[0].value}"\u001b[0m`
							: result.output[0]?.type == "BOOLEAN"
							? "\u001b[1;91m" + result.output[0]?.value + "\u001b[0m"
							: result.output[0].value
					);
				} catch(e) {
					console.error("\u001b[0;91mError: \u001b[0;1m"+e.message+"\u001b[0m");
				}

				if (debugMode) console.timeEnd("Execution took");

				ask();
			}
		);
	}

	ask();
}