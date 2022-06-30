import { TokenType } from "./token-type";
import { Node } from "./node";

export const nodeEvaluator = (node?: Node, literalEvaluator?: any) => {
  if (node?.literal) {
    return literalEvaluator(node.literal);
  }

  if (node?.op === TokenType.OP_NOT) {
    return !nodeEvaluator(node.left, literalEvaluator);
  }

  if (node?.op === TokenType.BINARY_OR) {
    return (
      nodeEvaluator(node.left, literalEvaluator) ||
      nodeEvaluator(node.right, literalEvaluator)
    );
  }

  if (node?.op === TokenType.BINARY_AND) {
    return (
      nodeEvaluator(node.left, literalEvaluator) &&
      nodeEvaluator(node.right, literalEvaluator)
    );
  }
};
