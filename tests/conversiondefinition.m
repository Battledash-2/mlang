convert hello, world {
    "Hello" + util.arg
}
func hello {
    util.log(util.arg)
}
hello("hi" => hello, world)