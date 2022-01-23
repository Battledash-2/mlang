const Screen = require("./display_on_screen");
const Typeof = require("./typeof");

module.exports = (str) => {
	if (str.hasOwnProperty("name")) str.type = Typeof(str.value);
	str.value = Screen(str.value);
	return (str == null || str?.type == "NULL")
		? "\u001b[1;35mnull\u001b[0m"
		: str?.type == "STRING"
		? `\u001b[92m"${str?.value}"\u001b[0m`
		: str?.type == "BOOLEAN"
		? "\u001b[1;91m" + String(str?.value) + "\u001b[0m"
		: str?.type == "NUMBER"
		? "\u001b[1;38;5;208m" + String(str?.value) + "\u001b[0m"
		: str?.value;
};
