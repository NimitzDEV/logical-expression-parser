import { type CustomOperator } from './ast.js';

export type TokenType =
  | 'literal'
  | 'lparen'
  | 'rparen'
  | 'not'
  | 'and'
  | 'or'
  | 'custom';

export interface Token {
  readonly type: TokenType;
  /** Raw text: the operator character/word, or the literal run. */
  readonly value: string;
  /** Character offset of the token in the input expression. */
  readonly offset: number;
}

const getBuiltinTokenType = (
  text: string,
): Exclude<TokenType, 'literal' | 'custom'> | undefined => {
  switch (text) {
    case '(':
      return 'lparen';
    case ')':
      return 'rparen';
    case '!':
      return 'not';
    case '&':
      return 'and';
    case '|':
      return 'or';
    default:
      return undefined;
  }
};

const WHITESPACE_PATTERN = /^\s+$/;

const escapeRegex = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const escapeCharClass = (s: string): string =>
  s.replace(/[-\\^\]]/g, '\\$&');

export const compileTokenizer = (
  customOperators?: readonly CustomOperator[],
): ((expression: string) => Token[]) => {
  if (!customOperators || customOperators.length === 0) {
    const builtinPattern = /\s+|[!&|()]|[^!&|()\s]+/gu;
    return (expression: string): Token[] => {
      const tokens: Token[] = [];
      for (const match of expression.matchAll(builtinPattern)) {
        const text = match[0];
        if (WHITESPACE_PATTERN.test(text)) {
          continue;
        }
        const builtinType = getBuiltinTokenType(text);
        tokens.push({
          type: builtinType ?? 'literal',
          value: text,
          offset: match.index!,
        });
      }
      return tokens;
    };
  }

  const customSymbolSet = new Set<string>();
  const wordOps: string[] = [];
  const symOps: string[] = [];
  const nonWordChars = new Set<string>(['(', ')', '!', '&', '|']);

  // Sort by length descending so longer operators match before prefixes (e.g. '->' before '-')
  const sortedOperators = [...customOperators].sort(
    (a, b) => b.symbol.length - a.symbol.length,
  );

  for (const op of sortedOperators) {
    customSymbolSet.add(op.symbol);
    if (/^\w+$/.test(op.symbol)) {
      wordOps.push(escapeRegex(op.symbol));
    } else {
      symOps.push(escapeRegex(op.symbol));
      for (const char of op.symbol) {
        nonWordChars.add(char);
      }
    }
  }

  // Built-in operators
  for (const builtin of ['!', '&', '|']) {
    symOps.push(escapeRegex(builtin));
  }
  symOps.sort((a, b) => b.length - a.length);

  const opPatterns: string[] = [];
  if (wordOps.length > 0) {
    opPatterns.push(...wordOps.map(w => `\\b${w}\\b`));
  }
  opPatterns.push(...symOps);

  const excludedClass = escapeCharClass([...nonWordChars].join(''));
  const dynamicPattern = new RegExp(
    `\\s+|[()]|${opPatterns.join('|')}|[^\\s${excludedClass}]+`,
    'gu',
  );

  return (expression: string): Token[] => {
    const tokens: Token[] = [];
    for (const match of expression.matchAll(dynamicPattern)) {
      const text = match[0];
      if (WHITESPACE_PATTERN.test(text)) {
        continue;
      }
      let type: TokenType;
      const builtinType = getBuiltinTokenType(text);
      if (builtinType) {
        type = builtinType;
      } else if (customSymbolSet.has(text)) {
        type = 'custom';
      } else {
        type = 'literal';
      }
      tokens.push({
        type,
        value: text,
        offset: match.index!,
      });
    }
    return tokens;
  };
};

export const tokenize = compileTokenizer();
