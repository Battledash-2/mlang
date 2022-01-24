// const form = (mod)=>{
// 	if (Array.isArray(mod)) {
// 		let res = "[ ";

// 		for (let k in mod) {
// 			let v = mod[k];
// 			if (k == mod.length-1) {
// 				if (v?.type == "IDENTIFIER") {res+=`${form(v?.value)}`;continue;}
// 				if (v?.type == "NULL") {res+=`NULL`;continue}
// 				if (typeof v?.value == "string" || typeof v == "string") {res+=`"${v?.value ?? v}"`;continue};
// 				res+=`${form(v)}`;
// 				continue;
// 			}
// 			if (v?.type == "IDENTIFIER") {res+=`${form(v?.value)}, `;continue;}
// 			if (v?.type == "NULL") {res+=`NULL`;continue}
// 			if (typeof v?.value == "string" || typeof v == "string") {res+=`"${v?.value ?? v}", `;continue};
// 			res+=`${typeof form(v) == "object" ? form(form(v)) : form(v)}, `;
// 		}
		
// 		res += " ]";
// 		return res.replace(/\s{1},\s{1}/, " ");
// 	} else {
// 		if (mod?.type == "IDENTIFIER") {return `${form(mod?.value)}`;}
// 		if (typeof mod?.value == "string" || typeof mod == "string") {return `"${mod?.value ?? mod}"`;};
// 		return mod?.value ?? mod;
// 	}
// }

// module.exports = form;
const Typeof = require("./typeof");
const Color = (str) => {
	if (typeof str !== "object") str = {value:str,type:Typeof(str)}
	if (str.hasOwnProperty("name")) str.type = Typeof(str.value);
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

const _f = (str, color=false, hs=true)=>{
	if ((typeof str == "string" || str?.type == "STRING") && hs) return color==true?Color(`${str?.value ?? str}`):`"${str?.value ?? str}"`;
	if (Array.isArray(str) || str?.type == "ARRAY") return color==true?form(str?.value ?? str,true):form(str?.value ?? str);
	if (typeof str == "number" || str?.type == "NUMBER") return color==true?Color(str?.value ?? str):str?.value ?? str;
	return str?.value ?? str;
}

const form = (str, color=false, hs=true)=>{
	if (str?.type) str=str?.value;
	if (Array.isArray(str)) {
		let res = "[ ";
		for (let v in str) {
			let c = str[v];
			res+=_f(c,color,hs);
			if (v <= str.length-2) {
				res+=", ";
			}
		}
		res += " ]";
		return res;
	} else {
		return _f(str,color,hs);
	}
}

module.exports = form;
module.exports["color"] = Color;