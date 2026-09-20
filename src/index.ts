import { parseTokens } from './parser.js';
import { tokenize } from './tokenizer.js';
import { evaluate, type AstNode, type TokenChecker } from './ast.js';

export { evaluate } from './ast.js';
export { LEPSyntaxError } from './parser.js';
export type { AstNode, BinaryNode, LiteralNode, NotNode, TokenChecker } from './ast.js';

/** Parses the expression into an AST. Throws `LEPSyntaxError` on malformed input. */
export const parseAst = (expression: string): AstNode =>
  parseTokens(tokenize(expression), expression.length);

/** Parses and evaluates the expression. Throws `LEPSyntaxError` on malformed input. */
export const parse = (expression: string, checker: TokenChecker): boolean =>
  evaluate(parseAst(expression), checker);
