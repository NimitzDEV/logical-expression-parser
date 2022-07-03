import { getTokenTypeByValue, Token } from "./token-type";

export type PolishList = { type: Token; value: string }[];

export const PolishNotation = (tokens: PolishList, customTokens: Map<Token, string>) => {
  const queue: PolishList = [];
  const stack: PolishList = [];
  tokens.forEach((token) => {

    const type: Token = getTokenTypeByValue(token.value, customTokens);
    switch (type) {
      case Token.LITERAL:
        queue.unshift(token);
        break;
      case Token.OPERATOR_AND:
      case Token.OPERATOR_OR:
      case Token.OPERATOR_NOT:
      case Token.PARENTHESES_OPEN:
        stack.push(token);
        break;
      case Token.PARENTHESES_CLOSE:
        while (
          stack.length &&
          stack[stack.length - 1].type !== Token.PARENTHESES_OPEN
        ) {
          const i = stack.pop();
          i && queue.unshift(i);
        }

        stack.pop();

        if (stack.length && stack[stack.length - 1].type === Token.OPERATOR_NOT) {
          const i = stack.pop();
          i && queue.unshift(i);
        }
        break;
      default:
        break;
    }
  });

  const result = (stack.length && [...stack.reverse(), ...queue]) || queue;

  return result;
};

export const PolishGenerator = function* (polish) {
  for (let index = 0; index < polish.length - 1; index++) {
    yield polish[index];
  }

  return polish[polish.length - 1];
};
