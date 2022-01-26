useStrict();

const nestedArray = ["poop", 43, ["pop", 2], ["nested", ["array", [":("]]]];
print(nestedArray); // [ poop, 43, [ "pop", 2 ], [ "nested", [ "array", [ ":(" ] ] ] ]

nestedArray[0] = "not poop"
print(nestedArray); // [ not poop, 43, [ "pop", 2 ], [ "nested", [ "array", [ ":(" ] ] ] ]

nestedArray[2][1] = 5;
print(nestedArray); // [ poop, 43, [ "pop", 5 ], [ "nested", [ "array", [ ":(" ] ] ] ]

nestedArray[3][1][1][0] = ":)";
print(nestedArray); // [ poop, 43, [ "pop", 5 ], [ "nested", [ "array", [ ":)" ] ] ] ]

// you must use brackets to use an expression within the item selector (otherwise it will error)
nestedArray[2][(0+1)] = 7;
print(nestedArray); // [ poop, 43, [ "pop", 7 ], [ "nested", [ "array", [ ":)" ] ] ] ]