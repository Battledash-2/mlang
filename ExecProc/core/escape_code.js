const escapes = [
    [/\\("|')/, "$1"],
    [/\\n/g, "\n"],
    [/\\e/g, "\u001b"],
    [/\\\\/g, "\\"],
    [/\\r/g, "\r"]
]

module.exports = (str)=>{
    const rs = (from, to)=>{
        str = str.replace(new RegExp("(?<!\\\\)" + from.source, "gi"), to);
    }

    for (let [regex, replace] of escapes) {
        rs(regex, replace);
    }

    return str;
}