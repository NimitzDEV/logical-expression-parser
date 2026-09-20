export type LiteralNode = { readonly type: 'literal'; readonly value: string };
export type NotNode = { readonly type: 'not'; readonly operand: AstNode };
export type BinaryNode = {
  readonly type: 'and' | 'or';
  readonly left: AstNode;
  readonly right: AstNode;
};
export type AstNode = LiteralNode | NotNode | BinaryNode;

export type TokenChecker = (token: string) => boolean;

/** Evaluates the AST using `checker` for each literal. Short-circuits like `&&`/`||`. */
export const evaluate = (node: AstNode, checker: TokenChecker): boolean => {
  switch (node.type) {
    case 'literal':
      return checker(node.value);
    case 'not':
      return !evaluate(node.operand, checker);
    case 'and':
      return evaluate(node.left, checker) && evaluate(node.right, checker);
    case 'or':
      return evaluate(node.left, checker) || evaluate(node.right, checker);
  }
};
