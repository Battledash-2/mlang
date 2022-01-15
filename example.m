let x = 25*27 // set variables
let y = x-util.pi // `util` library
let z = x*(y+(x*y)) // advanced multiplication

util.log(z) // log

let x = 5 // overwrite variables
let y = x-util.pi // variables don't automatically update to use the new `x`, so you have to do it manually
let z = x*(y+(x*y)) // advanced multiplication

util.log(z) // we get a different result!

let a = 89
let b = a // set a variable to another

util.log(b) // prints out b, which is 89

util.log(util.sin(1)) // functions like sin and cosin
util.log(util.cosin(1)) // cosin

// enums:
util.log(util.enum()) // 1
util.log(util.enum()) // 2
util.log(util.enum()) // 3
util.log(util.enum()) // 4
util.log(util.enum()) // 5
util.log(util.enum()) // 6

let e = 5+util.enum()*2 // use built-in functions in conjunction with operations
util.log(e)

let f = 5+util.sin(8)*2 // ^
util.log(f)

util.log(-(1)+2); // operations directly in `log`
util.log(-1); // negative numbers (all numbers are signed)

util.log(9 ^ .5) // exponents!

// we can also access the last set variable:
let helloWorld = 9*2+3 // should equal: 21

util.log(util.last) // should be 21

let other = helloWorld+1 // 22

util.log(util.last) // 22
util.log(util.last * 5) // 110

// conversion
util.log(1 => km, mi) // syntax: <num_to_convert> => <from>, <to>
let myConv = 100 => km, mi // 62
util.log(myConv) // 62
util.log(myConv => mi, km) // 100

let m = 5 => mi, m // 8046.7
util.log(m); // 8046.7
util.log(m => m, mi) // 4.9999860257

let m2 = 5 => km, m // 5000
util.log(m2) // 5000
util.log(m2 => m, km) // 5

// -----------------------------------------
let c = 40
let f = c => c, f
util.log(f) // negative numbers are not supported within conversion operations
util.log(f => f, c)