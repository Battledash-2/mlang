util.log(util.has("poop", "oosp")) // false
util.log(util.has("poop", "oop")) // true

func args {
	util.log(util.arg)
	util.log(util.arg1)
}

args("hi", "bro")