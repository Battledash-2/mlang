module.exports = (arg)=>{
	arg = (typeof arg).toUpperCase();
	switch (typeof arg) { // custom
		default:
			if (Array.isArray(arg)) return "ARRAY";
		// most of the types are the same as javascript, so we don't need anything here yet
	}

	return arg;
}