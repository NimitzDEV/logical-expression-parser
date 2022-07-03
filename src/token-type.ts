export enum Token {
  PARENTHESES_OPEN,
  PARENTHESES_CLOSE,
  OPERATOR_NOT,
  OPERATOR_AND,
  OPERATOR_OR,
  LITERAL,
  END,
  LEAF,
  ATOMIC,
}

export function getTokenTypeByValue(value: string, tokenList: Map<Token, string>): Token {

  for (const val of Array.from(tokenList.entries())) {
    if (val[1] === value) {
      return val[0] as Token
    }
  }

  return Token.LITERAL;
}
