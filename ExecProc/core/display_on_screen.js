const form = (mod)=>{
	if (Array.isArray(mod)) {
		let res = "[ ";

		for (let k in mod) {
			let v = mod[k];
			if (k == mod.length-1) {
				if (typeof v == "string") {res+=`"${v}`;continue};
				res+=`${form(v)}`;
				continue;
			}
			if (typeof v == "string") {res+=`"${v}", `;continue};
			res+=`${typeof form(v) == "object" ? form(form(v)) : form(v)}, `;
		}
		
		res += " ]";
		return res;
	} else {
		return mod?.value || mod;
	}
}

module.exports = form;