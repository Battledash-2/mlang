const escapes = [
    [/\\("|')/g, "$1"],
    [/\\n/g, "\n"],
    [/\\e/g, "\u001b"],
    [/\\r/g, "\r"],

    [/\\\\/g, "\\"]
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