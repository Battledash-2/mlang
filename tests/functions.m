func hello {
    util.log("Functions!")
    util.log(util.arg)
    5
}

util.log(hello(1)+1)

func hourToMinute {
    util.arg*60
}
util.log(hourToMinute(1))