import { TokenType } from "./token-type";

export interface Node {
  op: TokenType;
  left?: Node;
  right?: Node;
  literal?: string;
}

export function isAtomicNode(node: Node): boolean {
  return (
    node.op === TokenType.LEAF ||
    (node.op === TokenType.OP_NOT && node.left?.op === TokenType.LEAF)
  );
}
