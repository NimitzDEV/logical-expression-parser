const Tokenizer = require('./tokenizer');
const Polish = require('./polish');
const Node = require('./node');

const parse = (exp, literalChecker) => {
  const tokens = Tokenizer(exp);
  const polish = Polish.PolishNotation(tokens);
  const gen = Polish.PolishGenerator(polish);
  const tree = Node.make(gen);
  const result = Node.nodeEvaluator(tree, literalChecker);
  return result;
};

module.exports = { parse };
