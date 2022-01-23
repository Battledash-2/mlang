const form = (mod)=>{
	if (Array.isArray(mod)) {
		let res = "[ ";

		for (let k in mod) {
			let v = mod[k];
			if (k == mod.length-1) {
				if (v?.type == "IDENTIFIER") {res+=`${form(v?.value)}`;continue;}
				if (typeof v?.value == "string" || typeof v == "string") {res+=`"${v?.value ?? v}"`;continue};
				res+=`${form(v)}`;
				continue;
			}
			if (v?.type == "IDENTIFIER") {res+=`${form(v?.value)}, `;continue;}
			if (typeof v?.value == "string" || typeof v == "string") {res+=`"${v?.value ?? v}", `;continue};
			res+=`${typeof form(v) == "object" ? form(form(v)) : form(v)}, `;
		}
		
		res += " ]";
		return res.replace(/\s{1},\s{1}/, " ");
	} else {
		if (mod?.type == "IDENTIFIER") {return `${form(mod?.value)}`;}
		if (typeof mod?.value == "string" || typeof mod == "string") {return `"${mod?.value ?? mod}", `;};
		return mod?.value ?? mod;
	}
}

module.exports = form;