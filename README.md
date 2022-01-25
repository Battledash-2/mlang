# MLang (v1.8.5patch-6): The Mathematics Language

## What is M

#### M is an open-source language that is meant to help people learn about Tokenizers, Parsers, and interpreters. It supports variables, logging, and expressions.

## Project Status

#### Version: v1.8.5patch-6
- Modified `printf` functionality (`printf("hello %l", "hello")` will output "hello 5")
- Better repl (using `let varname = 5` and then in the next prompt entering `print(varname)` will work)
- Bug fix & constant variables (with `const` keyword)

## Known Bugs
- UPDATED: `printf` and `format` functions now also include the position of an error (in the case one occurs)
- FIXED: Error positioning was sometimes negative because of strings

## To-Do (in order from Most Important to Least Important)
- [ ] Add 'import ... as ...'
- [ ] Add options to modify a value in an array [***HIGH* PRIORITY**]
- [ ] Objects [***NOT* EXPECTED**]

## Scrapped Ideas (maybe in the future?)
- Nothing scrapped...
-----------------------------------------

## Done
- [x] Arrays
- [x] Scopes [***HIGH* PRIORITY**]
- [x] Strings module
- [x] HTTP Module (Possible, but unexpected)
- [x] While loops
- [x] Operations like `varName += 5`
- [x] Better `import`/`export`
- [x] Multiple arguments in functions (util.arg, util.arg1, util.arg2 || $pid, $pid1, $pid2)
- [x] Javascript API (Priority: extremely low / not expected soon)
- [x] Pseudo-pointers / Reference to `$pid` (passed in variable to a function) and `$last` (last variable set) (Priority: unexpected)
- [x] Conditional statements (Priority: HIGH)
- [x] Multi-line comments (Priority: extremely low)
- [x] Export keyword (Priority: unknown)
- [x] Import files (Priority: unknown)
- [x] Minimal string support (Priority: unknown)
- [x] Functions (Priority: Medium)
- [x] Unit Conversion (Priority: unknown)
- [x] Expressions (Priority: HIGH)
- [x] Variables (Priority: Medium)
- [x] Logging (Priority: Low)
- [x] Built-in Functions (Priority: unknown)

## Want a tutorial on how you can make your own language?

### Well, are you in luck! I've recently created a tutorial for making [a simple number interpreter from scratch](https://number-interpreter-from-scratch.battledash2.repl.co).

#### Check it out!
