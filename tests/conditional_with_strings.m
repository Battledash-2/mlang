func isOver5Char {
	if (util.strlen(util.arg) > 5) {
		util.log("OVER 5")
	} else {
		util.log("UNDER 5")
	}
}

isOver5Char("poo") // no (3 chars)
isOver5Char("poop5") // no (5 chars [we're using the more than symbol rather then the more than or equal to symbol])
isOver5Char("poop45") // yes (6 chars)