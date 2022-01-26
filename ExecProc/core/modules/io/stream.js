const fs = require("fs");

module.exports["prompt"] = (prompt, mask)=>{
	let str = "";
	let index = 0, pos=0;
	let buf = Buffer.alloc(3);

	let stdin = (process.platform === "win32") ? process.stdin.fd : fs.openSync("/dev/tty", "rs"); // r: reading; s: sync

	process.stdout.write(prompt);

	let originRaw = process.stdin.isRaw;
	if (!originRaw) process.stdin.setRawMode && process.stdin.setRawMode(true);

	const isNewline = (char)=>{
		return char === 13 || char === 10; // 10: newline (\n); 13: carriage return (\r)
	}
	const isDelete = (char)=>{
		return char === 127 || (process.platform == "win32" && char === 8);
	}

	while (true) {
		let read = fs.readSync(stdin, buf, 0, 3);
		if (read > 1) { // most likely not a character
			switch (buf.toString()) {
				case "\u001b[D": // left arrow
					var old = index;
					
					index = (--index < 0) ? 0 : index;
					pos = index;
					if (old - index) process.stdout.write("\u001b[D");

					break;
				case "\u001b[C": // right arrow
					if (index < str.length) {
						pos = ++index+1; // same as index = index+2; pos = index+1;
						process.stdout.write("\u001b[C");
					}

					break;
			}
			continue;
		}
		let char = buf[read-1];

		if (isNewline(char)) {
			str = str.replace(/\u001b|\u000b|\n/, "");
			fs.closeSync(stdin);
			break;
		}

		if (isDelete(char)) {
			if (!index) continue;

			str = str.slice(0, index-1) + str.slice(index);
			index--;

			pos = pos <= str.length ? index : index+1;
		} else {
			str = str.slice(0, index) + String.fromCharCode(char) + str.slice(index);
			index++;

			pos = index+1;
		}
		
		process.stdout.write(`\u001b[0G\u001b[K${prompt}${mask != null ? mask.repeat(str.length) : str}\u001b[${str.length-pos}D`);
	}

	process.stdin.setRawMode && process.stdin.setRawMode(originRaw);

	console.log("");
	return str;
}