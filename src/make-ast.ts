import { Token } from "./token-type";
import { Node } from "./node";

export const make = (gen: Generator): Node | undefined => {
  const data: any = gen.next().value;

  switch (data.type) {
    case Token.LITERAL:
      return { op: Token.LEAF, literal: data.value };

    case Token.OPERATOR_NOT:
      return { op: Token.OPERATOR_NOT, left: make(gen) };

    case Token.OPERATOR_AND:
      return {
        op: Token.OPERATOR_AND,
        left: make(gen),
        right: make(gen),
      };

    case Token.OPERATOR_OR:
      return {
        op: Token.OPERATOR_OR,
        left: make(gen),
        right: make(gen),
      };
  }
};
