# Logical Expression Parser

[![npm version](https://badge.fury.io/js/logical-expression-parser.svg)](https://badge.fury.io/js/logical-expression-parser)

This is a logical expression parser for JavaScript, it can parse a logical expression into a AST object and evaluates the result using your token checking function.

## Supported logical operators
1. `|` Or
1. `&` And
1. `!` Not
1. `()` Parentheses

## How it works
1. The parser parse and tokenize the expression, for example one of your function requires `REGISTED&(SPECIAL|INVITED)`
1. Parser then will pass `REGISTED`, `SPECIAL` and `INVITED` into your token checking function to get a boolean result
1. Finaly the parser will evaluates the final result

## Example
```javascript
const LEP = require('logical-expression-parser');

const REQUIREMENTS = 'REGISTED&(SPECIAL|INVITED)';
const LIST_A = ['REGISTED', 'INVITED'];
const LIST_B = ['SPECIAL', 'EXPERT'];

const RESULT_A = LEP.parse(REQUIREMENTS, t => LIST_A.indexOf(t) > -1);
const RESULT_B = LEP.parse(REQUIREMENTS, t => LIST_B.indexOf(t) > -1);

// RESULT_A: true
// RESULT_B: false
```