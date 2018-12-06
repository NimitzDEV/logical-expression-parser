const TokenType = require('./token-type');

const PolishNotation = tokens => {
  const queue = [];
  const stack = [];
  tokens.forEach(token => {
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
          queue.unshift(stack.pop());
        }

        stack.pop();

        if (stack.length && stack[stack.length - 1].type === TokenType.OP_NOT) {
          queue.unshift(stack.pop());
        }
        break;
      default:
        break;
    }
  });

  const result = (stack.length && [...stack.reverse(), ...queue]) || queue;

  return result;
};

// 波兰列表生成器
const PolishGenerator = function*(polish) {
  for (let index = 0; index < polish.length - 1; index++) {
    yield polish[index];
  }

  return polish[polish.length - 1];
};

module.exports = {
  PolishNotation,
  PolishGenerator
};
