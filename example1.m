import "./tests/imports_greet.m"

func sayHelloTo {
	util.log("Hello, " + util.arg + "!")
}

sayHelloTo("Nemo") // Hello, Nemo!

let greeting = "Hey"
util.log(greet("Dora")) // Hey, Dora!