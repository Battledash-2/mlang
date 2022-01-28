# MLang (v1.8.7): The Mathematics Language

## What is M

#### M is an open-source language that is meant to help people learn about Tokenizers, Parsers, and interpreters. It supports variables, logging, and expressions.

## Project Status

#### Version: v1.8.7
- If a `{ block }` is expected but a `{` isn't seen, it will allow a single expression to pass (which also means there is support for `else if`)

## Package manager
- There is a package manager under development by [justamirror](https://github.com/justamirror) that you can see [here](https://github.com/justamirror/MPM).
- There isn't any official package manager as of now, if any others pop up they will be mentioned here.

## Known Bugs
- PENDING: `print` with multiple arguments prints an array instead of formatting all args
- PENDING: Can't return a variable
- UPDATED: `printf` and `format` functions now also include the position of an error (in the case one occurs)
- FIXED: Error positioning was sometimes negative because of strings

## To-Do (in order from Most Important to Least Important)
- [ ] Add 'import ... as ...'
- [ ] Objects [***NOT* EXPECTED**]

## Scrapped Ideas (maybe in the future?)
- Nothing scrapped...
-----------------------------------------

## Done
- [x] Add options to modify a value in an array [***HIGH* PRIORITY**]
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
