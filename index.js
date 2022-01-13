const cli = require("cli2json").parse(process.argv.slice(2).join(" "), {
readCommandAfter: ["-m", "--mode"]
})
const fs = require("fs");
const readline = require("readline");

const mode = cli.flags[0].split(" ").shift() || "-f";
const filename  = cli.commands[0] || (() => {
console.log("No file! Exiting");
process.exit(1);
})()

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
