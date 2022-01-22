import "cmd"
import "std"


std::log("Color coding the terminal!\n")

util.log(cmd::bold(cmd::rgb("this is colored", 28, 182, 92)))
cmd::write(cmd::reset("")) // `util.log` is formatted, so it will put a newline after (cmd/write is also a duplicate of process/out/write)
util.log(cmd::bold(cmd::hex("hex coloring!", "#333")) + cmd::reset())

std::log("Not feeling like presets?\n")

util.log("\e[1;48;5;232mHello! I have a background :)\e[0m") // this isn't part of 'cmd'