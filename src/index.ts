import { Tokenizer } from "./tokenizer";
import { PolishGenerator, PolishNotation } from "./polish";
import { nodeEvaluator } from "./node-evaluator";
import { make } from "./make-ast";

export const parse = (
  expression: string,
  literalChecker: (item: string) => boolean
) => {
  const tokens = Tokenizer(expression);
  const polish = PolishNotation(tokens);
  const gen = PolishGenerator(polish);
  const ast = make(gen);
  return nodeEvaluator(ast, literalChecker);
};
