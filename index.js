function isInArray(str, array) {
    return array.indexOf(str) !== -1
}

function cliParser(cmd, settings) {
    var flags = [];
    var def = [];
    var doNotPush = [];
    global.parsed = {};
    var splitCommands = cmd.split(" ");
    cmd.split(" ").forEach(function(arg, indexer) {
        if (arg.startsWith("--") || arg.startsWith("-")) {
            if (settings) {
                if (settings.readCommandAfter) {
                    if (isInArray(arg, settings.readCommandAfter)) {
                        flags.push(arg + " " + splitCommands[indexer + 1]);
                        doNotPush.push(splitCommands[indexer + 1]);
                    } else {
                        if (!isInArray(splitCommands[indexer + 1], doNotPush))  {
                            flags.push(arg);
                        }
                    }
                }
            }
        } else {
            if (!isInArray(arg, doNotPush)) {
                def.push(arg);
            }
        }
        if (indexer + 1 == cmd.split(" ").length) {
            parsed = {
                commands: def,
                flags: flags
            }
        }
    })
    return parsed;
}


const fs = require("fs");
const readline = require("readline");

var cli = cliParser(process.argv.slice(2).join(" "), {
readCommandAfter: ["-m", "--mode"]
});

var mode;
if (cli.commands[0]) {
mode = cli.flags[0].split(" ").pop() || "f"
}
else {
mode = "c"
}

const filename  = process.argv[3]; // file or terminal / console

const ExecProc = require("./ExecProc");

if (mode == null) {
    console.error("Missing argument 1");
} else {
    if (mode.toLowerCase() == "f") {
        if (fs.existsSync(filename)) {
            // console.log(String(fs.readFileSync(filename)));
            const filecontent = String(fs.readFileSync(filename));
            const result      = new ExecProc(filecontent, filename, filename.toLowerCase().startsWith("c:") ? filename : `${__dirname}\\${filename}`);
            console.log("Result execution process: "+JSON.stringify(result, null, 4));
        } else {
            console.error(`File '${filename}' does not exist.`);
        }
    } else if(mode.toLowerCase() == "c") {
        const interface = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const isExit = text => {
            text = text.toLowerCase();
            return text == "exit" || text == "cls" || text == "clear" || text.slice(1) == "exit" || text.slice(1) == "cls" || text.slice(1) == "exit";
        }

        function ask() {
            interface.question("calculate > ", (response)=>{
                if (isExit(response)) {
                    interface.close();
                    console.log("\033c"); // clears console
                    return;
                }

                const result = new ExecProc(response, "runtime", "runtime");
                console.log("Result execution process: "+JSON.stringify(result, null, 4));

                ask();
            });
        }

        ask();
    }
}
