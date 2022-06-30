import { TokenType } from "./token-type";
import { Node } from "./node";

export const make = (gen: Generator): Node | undefined => {
  const data: any = gen.next().value;

  switch (data.type) {
    case TokenType.LITERAL:
      return { op: TokenType.LEAF, literal: data.value };

    case TokenType.OP_NOT:
      return { op: TokenType.OP_NOT, left: make(gen) };

    case TokenType.BINARY_AND:
      return {
        op: TokenType.BINARY_AND,
        left: make(gen),
        right: make(gen),
      };

    case TokenType.BINARY_OR:
      return {
        op: TokenType.BINARY_OR,
        left: make(gen),
        right: make(gen),
      };
  }
};
