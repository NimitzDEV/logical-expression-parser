import { getTokenTypeByValue, Token } from "./token-type";

export const Tokenizer = (expression, customTokens: Map<Token, string>) => {
  let literal = "";
  const tokens: { type: Token; value: string }[] = [];
  for (const char of expression) {
    const token: Token = getTokenTypeByValue(char, customTokens)
    switch (token) {
      case Token.PARENTHESES_OPEN:
      case Token.PARENTHESES_OPEN:
      case Token.PARENTHESES_CLOSE:
      case Token.OPERATOR_NOT:
      case Token.OPERATOR_AND:
      case Token.OPERATOR_OR:
        if (literal) {
          tokens.push({
            type: Token.LITERAL,
            value: literal,
          });
          literal = "";
        }

        tokens.push({
          type: token,
          value: char,
        });
        break;
      default:
        literal += char;
    }
  }

  if (literal)
    tokens.push({
      type: Token.LITERAL,
      value: literal,
    });

  return tokens;
};
