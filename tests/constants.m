let hello = "hi";
var hey = "poo";

const constant = "CONST"

print(hello);
print(hey);
print(constant);

hello = hey;
hey = constant;
constant = "ye"; // error

print(hello);
print(hey);
print(constant);