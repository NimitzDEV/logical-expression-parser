import { Token } from "./token-type";
import { Node } from "./node";

export const nodeEvaluator = (node?: Node, literalEvaluator?: any, entities?: (string | number)[]) => {
  if (node?.literal) {
    return literalEvaluator(node.literal, entities);
  }

  if (node?.op === Token.OPERATOR_NOT) {
    return !nodeEvaluator(node?.left, literalEvaluator, entities);
  }

  if (node?.op === Token.OPERATOR_OR) {
    return (
      nodeEvaluator(node?.left, literalEvaluator, entities) ||
      nodeEvaluator(node?.right, literalEvaluator, entities)
    );
  }

  if (node?.op === Token.OPERATOR_AND) {
    return (
      nodeEvaluator(node?.left, literalEvaluator, entities) &&
      nodeEvaluator(node?.right, literalEvaluator, entities)
    );
  }
};
