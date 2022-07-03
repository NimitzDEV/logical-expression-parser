import { make } from "./make-ast";
import { nodeEvaluator } from "./node-evaluator";
import { PolishNotation, PolishGenerator } from "./polish";
import { Token } from "./token-type";
import { Tokenizer } from "./tokenizer";

export class ExpressionParserFactory {

  static init() {
    return new ExpressionParserFactory()
  }

  private tokens = new Map<Token, string>();

  private literalCheck;

  setLiteralEvaluator = (checkFunc: (item, entities) => boolean) => {
    this.literalCheck = checkFunc
    return this
  }

  setToken(t: Token, sign: string) {
    this.tokens.set(t, sign)
    return this;
  }

  build = () => {
    return new Expression(this.tokens, this.literalCheck )
  }
}

class Expression {

  private literalCheck = (item, entities) => entities.includes(item);
  
  private tokens = new Map<Token, string>([
    [Token.PARENTHESES_OPEN, '('],
    [Token.PARENTHESES_CLOSE, ')'],
    [Token.OPERATOR_NOT, '!'],
    [Token.OPERATOR_AND, '&'],
    [Token.OPERATOR_OR, '/'],
    [Token.LITERAL, 'LITERAL'],
    [Token.END, 'END'],
    [Token.LEAF, 'LEAF'],
    [Token.ATOMIC, 'ATOMIC'],
  ]);

  constructor(tokens: Map<Token, string>, litCheck?: (item, entities) => boolean) {
    for (const [t, v] of tokens) {
      this.tokens.set(t, v)
    }

    if (litCheck) {
      this.literalCheck = litCheck
    }
  }


  evaluate(expression: string, entities: (string | number)[]) {
      const tokens = Tokenizer(expression, this.tokens);
      const polish = PolishNotation(tokens, this.tokens);
      const gen = PolishGenerator(polish);
      const ast = make(gen);
      return nodeEvaluator(ast, this.literalCheck, entities);
  }
}
