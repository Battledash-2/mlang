import"cmd";
import"io";

io::write("IO utils? Nice!\n"+cmd::reset());
const name = io::read(cmd::bold("What's you're "+cmd::blue("name"))+cmd::reset()+cmd::bold("?")+cmd::reset(" "));
const msg = cmd::reset(cmd::bold(cmd::red("Hey, "))) + cmd::reset() + cmd::blue("%v") + cmd::reset() + cmd::reset(cmd::bold("!"));

printf(msg, name);

// Unstable and not recommended
// const msg = cmd::reset(cmd::bold(cmd::red("Hey, "))) + cmd::reset() + cmd::blue("%v") + cmd::reset() + cmd::reset(cmd::bold("!"));
// const prompt = cmd::bold("What's you're "+cmd::blue("name"))+cmd::reset()+cmd::bold("?")+cmd::reset(" ");

// func p {
// 	printf(msg, util.arg)
// 	io::close();
// }

// io::readcb(prompt, p);