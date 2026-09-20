import { parseTokens } from './parser.js';
import { tokenize } from './tokenizer.js';
import {
  evaluate,
  evaluateAsync,
  type AstNode,
  type AsyncTokenChecker,
  type TokenChecker,
} from './ast.js';

export { evaluate, evaluateAsync } from './ast.js';
export { LEPSyntaxError } from './parser.js';
export type {
  AstNode,
  AsyncTokenChecker,
  BinaryNode,
  LiteralNode,
  NotNode,
  TokenChecker,
} from './ast.js';

/** Parses the expression into an AST. Throws `TypeError` or `LEPSyntaxError` on malformed input. */
export const parseAst = (expression: string): AstNode => {
  if (typeof expression !== 'string') {
    throw new TypeError(
      `Expected expression to be a string, got ${expression === null ? 'null' : typeof expression}`,
    );
  }
  return parseTokens(tokenize(expression), expression.length);
};

/** Parses and evaluates the expression. Throws `TypeError` or `LEPSyntaxError` on malformed input. */
export const parse = (expression: string, checker: TokenChecker): boolean =>
  evaluate(parseAst(expression), checker);

/** Parses and evaluates the expression asynchronously. Throws `TypeError` or `LEPSyntaxError` on malformed input. */
export const parseAsync = async (
  expression: string,
  checker: AsyncTokenChecker,
): Promise<boolean> => evaluateAsync(parseAst(expression), checker);
