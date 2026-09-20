import { parseTokens } from './parser.js';
import { compileTokenizer } from './tokenizer.js';
import {
  buildOperatorRegistry,
  evaluateNode,
  evaluateNodeAsync,
  type AstNode,
  type AsyncTokenChecker,
  type CustomOperator,
  type TokenChecker,
} from './ast.js';

export { LEPSyntaxError } from './parser.js';
export type {
  AstNode,
  AsyncTokenChecker,
  Associativity,
  BinaryNode,
  CustomBinaryNode,
  CustomBinaryOperator,
  CustomOperator,
  CustomUnaryNode,
  CustomUnaryOperator,
  EvaluateOptions,
  LiteralNode,
  NotNode,
  TokenChecker,
} from './ast.js';

export interface ParserOptions {
  /** Additional custom operators to register alongside built-in !, &, |. */
  readonly customOperators?: readonly CustomOperator[];
}

export interface ParserInstance {
  /** Parses the expression into an AST. Throws `TypeError` or `LEPSyntaxError` on malformed input. */
  readonly parseAst: (expression: string) => AstNode;
  /** Parses and evaluates the expression. Throws `TypeError` or `LEPSyntaxError` on malformed input. */
  readonly parse: (expression: string, checker: TokenChecker) => boolean;
  /** Parses and evaluates the expression asynchronously. Throws `TypeError` or `LEPSyntaxError` on malformed input. */
  readonly parseAsync: (
    expression: string,
    checker: AsyncTokenChecker,
  ) => Promise<boolean>;
  /** Evaluates the AST using `checker` for each literal. Short-circuits like `&&`/`||`. */
  readonly evaluate: (node: AstNode, checker: TokenChecker) => boolean;
  /** Evaluates the AST asynchronously using `checker` for each literal. Short-circuits like `&&`/`||`. */
  readonly evaluateAsync: (
    node: AstNode,
    checker: AsyncTokenChecker,
  ) => Promise<boolean>;
}

/**
 * Creates an isolated parser instance configured with custom operators.
 */
export const createParser = (options?: ParserOptions): ParserInstance => {
  const customOperators = options?.customOperators;
  const registry = buildOperatorRegistry(customOperators);
  const tokenizer = compileTokenizer(customOperators);

  const parseAst = (expression: string): AstNode => {
    if (typeof expression !== 'string') {
      throw new TypeError(
        `Expected expression to be a string, got ${expression === null ? 'null' : typeof expression}`,
      );
    }
    return parseTokens(tokenizer(expression), expression.length, registry);
  };

  const evaluateInstance = (node: AstNode, checker: TokenChecker): boolean => {
    if (typeof checker !== 'function') {
      throw new TypeError(
        `Expected checker to be a function, got ${checker === null ? 'null' : typeof checker}`,
      );
    }
    return evaluateNode(node, checker, registry);
  };

  const evaluateAsyncInstance = async (
    node: AstNode,
    checker: AsyncTokenChecker,
  ): Promise<boolean> => {
    if (typeof checker !== 'function') {
      throw new TypeError(
        `Expected checker to be a function, got ${checker === null ? 'null' : typeof checker}`,
      );
    }
    return evaluateNodeAsync(node, checker, registry);
  };

  const parse = (expression: string, checker: TokenChecker): boolean =>
    evaluateInstance(parseAst(expression), checker);

  const parseAsync = async (
    expression: string,
    checker: AsyncTokenChecker,
  ): Promise<boolean> => evaluateAsyncInstance(parseAst(expression), checker);

  return {
    parseAst,
    parse,
    parseAsync,
    evaluate: evaluateInstance,
    evaluateAsync: evaluateAsyncInstance,
  };
};

const defaultParser = createParser();

/** Parses the expression into an AST using default operators (!, &, |). */
export const parseAst = defaultParser.parseAst;

/** Parses and evaluates the expression using default operators (!, &, |). */
export const parse = defaultParser.parse;

/** Parses and evaluates the expression asynchronously using default operators (!, &, |). */
export const parseAsync = defaultParser.parseAsync;

/** Evaluates the AST using `checker` for each literal. Supports optional customOperators. */
export { evaluate, evaluateAsync } from './ast.js';
