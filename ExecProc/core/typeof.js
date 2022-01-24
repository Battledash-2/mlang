module.exports = (arg)=>{
	arg = (typeof arg).toUpperCase();
	switch (typeof arg) { // custom
		case "undefined":
			return "NULL";
		case "object":
			if (Array.isArray(arg)) return "ARRAY";
		// most of the types are the same as javascript, so we don't need much here yet
	}

	return arg;
}