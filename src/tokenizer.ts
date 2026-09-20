export type TokenType = 'literal' | 'lparen' | 'rparen' | 'not' | 'and' | 'or';

export interface Token {
  readonly type: TokenType;
  /** Raw text: the operator character, or the literal run. */
  readonly value: string;
  /** Character offset of the token in the input expression. */
  readonly offset: number;
}

const OPERATOR_TYPES: Record<string, Exclude<TokenType, 'literal'>> = {
  '(': 'lparen',
  ')': 'rparen',
  '!': 'not',
  '&': 'and',
  '|': 'or',
};

// whitespace | single-char operator | literal run (the /u flag keeps
// surrogate pairs such as emoji intact inside literal runs)
const TOKEN_PATTERN = /\s+|[!&|()]|[^!&|()\s]+/g;

export const tokenize = (expression: string): Token[] => {
  const tokens: Token[] = [];
  TOKEN_PATTERN.lastIndex = 0;
  for (
    let match = TOKEN_PATTERN.exec(expression);
    match !== null;
    match = TOKEN_PATTERN.exec(expression)
  ) {
    const text = match[0];
    if (/^\s+$/.test(text)) {
      continue;
    }
    tokens.push({
      type: OPERATOR_TYPES[text] ?? 'literal',
      value: text,
      offset: match.index,
    });
  }
  return tokens;
};
