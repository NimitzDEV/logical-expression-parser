import { getTokenTypeByValue, TokenType } from "./token-type";

export const Tokenizer = (expression) => {
  let literal = "";
  const tokens: { type: TokenType; value: string }[] = [];
  for (const char of expression) {
    switch (char) {
      case TokenType.PAR_OPEN:
      case TokenType.PAR_CLOSE:
      case TokenType.OP_NOT:
      case TokenType.BINARY_AND:
      case TokenType.BINARY_OR:
        if (literal) {
          tokens.push({
            type: TokenType.LITERAL,
            value: literal,
          });
          literal = "";
        }

        tokens.push({
          type: getTokenTypeByValue(char),
          value: char,
        });
        break;
      default:
        literal += char;
    }
  }

  if (literal)
    tokens.push({
      type: TokenType.LITERAL,
      value: literal,
    });

  return tokens;
};
