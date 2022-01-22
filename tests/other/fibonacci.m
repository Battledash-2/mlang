let a = 0; // define a
let f1 = 1; // define f1
let f2 = 1; // define f2

func fib { // define function 'fib'
	if (a <= util.arg) { // check if a is less than 16
		print(f1+" "+f2); // print the value of f1 and f2
		f1 = f2;
		f2 += f1;
		a += 1; // add one to a (essentially a++ in other languages)

		fib(util.arg); // recursive
	} else {
		print("DONE!");
	}
};

fib(17);