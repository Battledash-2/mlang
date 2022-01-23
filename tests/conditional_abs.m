func abs {
	if (util.arg > 0) {
		util.arg
	} else {
		+util.arg
	}
}

util.log(abs(48))
util.log(abs(-43))