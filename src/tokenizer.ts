export type TokenType = 'literal' | 'lparen' | 'rparen' | 'not' | 'and' | 'or';

export interface Token {
  readonly type: TokenType;
  /** Raw text: the operator character, or the literal run. */
  readonly value: string;
  /** Character offset of the token in the input expression. */
  readonly offset: number;
}

const getTokenType = (text: string): TokenType => {
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
      return 'literal';
  }
};

// whitespace | single-char operator | literal run (the /u flag keeps
// surrogate pairs such as emoji intact inside literal runs)
const TOKEN_PATTERN = /\s+|[!&|()]|[^!&|()\s]+/gu;
const WHITESPACE_PATTERN = /^\s+$/;

export const tokenize = (expression: string): Token[] => {
  const tokens: Token[] = [];
  TOKEN_PATTERN.lastIndex = 0;
  for (
    let match = TOKEN_PATTERN.exec(expression);
    match !== null;
    match = TOKEN_PATTERN.exec(expression)
  ) {
    const text = match[0];
    if (WHITESPACE_PATTERN.test(text)) {
      continue;
    }
    tokens.push({
      type: getTokenType(text),
      value: text,
      offset: match.index,
    });
  }
  return tokens;
};
