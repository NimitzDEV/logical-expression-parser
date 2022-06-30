import { TokenType } from "./token-type";

export type PolishList = { type: TokenType; value: string }[];

export const PolishNotation = (tokens: PolishList) => {
  const queue: PolishList = [];
  const stack: PolishList = [];
  tokens.forEach((token) => {
    switch (token.type) {
      case TokenType.LITERAL:
        queue.unshift(token);
        break;
      case TokenType.BINARY_AND:
      case TokenType.BINARY_OR:
      case TokenType.OP_NOT:
      case TokenType.PAR_OPEN:
        stack.push(token);
        break;
      case TokenType.PAR_CLOSE:
        while (
          stack.length &&
          stack[stack.length - 1].type !== TokenType.PAR_OPEN
        ) {
          const i = stack.pop();
          i && queue.unshift(i);
        }

        stack.pop();

        if (stack.length && stack[stack.length - 1].type === TokenType.OP_NOT) {
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
