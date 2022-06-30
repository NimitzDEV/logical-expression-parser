export enum TokenType {
  PAR_OPEN = "(",
  PAR_CLOSE = ")",
  OP_NOT = "!",
  BINARY_AND = "&",
  BINARY_OR = "|",
  LITERAL = "LITERAL",
  END = "END",
  LEAF = "LEAF",
  ATOMIC = "ATOMIC",
}

export function getTokenTypeByValue(value: string): TokenType {
  const indexOfS = Object.values(TokenType).indexOf(
    value as unknown as TokenType
  );

  const key = Object.keys(TokenType)[indexOfS];

  return key as TokenType;
}
