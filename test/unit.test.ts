import { ExpressionParserFactory } from "../src";
import { Token } from "../src/token-type";

test("simple positive", () => {
  const defaultEvaluator = ExpressionParserFactory.init().build();
  const entities = ["A", "B"];
  const result = defaultEvaluator.evaluate("A&B", entities);

  expect(result).toBe(true);
});

test("simple negative", () => {
  const defaultEvaluator = ExpressionParserFactory.init().build();
  const entities = ["A", "C"];
  const result = defaultEvaluator.evaluate("A&B", entities);
  
  expect(result).toBe(false);
});

test("medium positive", () => {
  const defaultEvaluator = ExpressionParserFactory.init().build();
  const entities = ["A", "C", "E", "F", "G", "H"];
  const result = defaultEvaluator.evaluate("A&B/(X/E)&(G&H)", entities);

  expect(result).toBe(true);
});

test("medium negative", () => {
  const defaultEvaluator = ExpressionParserFactory.init().build();
  const entities = ["A", "C", "E", "F", "G", "H"];
  const result = defaultEvaluator.evaluate("(A&B&U)/((X/Y)&(G&H))", entities);

  expect(result).toBe(false);
});

test("custom tokens", () => {
  const evaluator = ExpressionParserFactory.init()
    .setToken(Token.OPERATOR_AND, '+')
    .setToken(Token.OPERATOR_NOT, '-')
    .setToken(Token.OPERATOR_OR, '|')
    .setToken(Token.PARENTHESES_OPEN, '{')
    .setToken(Token.PARENTHESES_CLOSE, '}')
    .build();

  const result = evaluator.evaluate("{A+C}|{B&-C}", ['A', 'B'])

  expect(result).toBe(true);
})