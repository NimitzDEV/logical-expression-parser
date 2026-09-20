export type LiteralNode = { readonly type: 'literal'; readonly value: string };
export type NotNode = { readonly type: 'not'; readonly operand: AstNode };
export type BinaryNode = {
  readonly type: 'and' | 'or';
  readonly left: AstNode;
  readonly right: AstNode;
};
export type AstNode = LiteralNode | NotNode | BinaryNode;

export type TokenChecker = (token: string) => boolean;
export type AsyncTokenChecker = (token: string) => boolean | Promise<boolean>;

const evaluateNode = (node: AstNode, checker: TokenChecker): boolean => {
  switch (node.type) {
    case 'literal':
      return checker(node.value);
    case 'not':
      return !evaluateNode(node.operand, checker);
    case 'and':
      return evaluateNode(node.left, checker) && evaluateNode(node.right, checker);
    case 'or':
      return evaluateNode(node.left, checker) || evaluateNode(node.right, checker);
  }
};

/** Evaluates the AST using `checker` for each literal. Short-circuits like `&&`/`||`. */
export const evaluate = (node: AstNode, checker: TokenChecker): boolean => {
  if (typeof checker !== 'function') {
    throw new TypeError(
      `Expected checker to be a function, got ${checker === null ? 'null' : typeof checker}`,
    );
  }
  return evaluateNode(node, checker);
};

const evaluateNodeAsync = async (
  node: AstNode,
  checker: AsyncTokenChecker,
): Promise<boolean> => {
  switch (node.type) {
    case 'literal':
      return Boolean(await checker(node.value));
    case 'not':
      return !(await evaluateNodeAsync(node.operand, checker));
    case 'and': {
      const left = await evaluateNodeAsync(node.left, checker);
      return left ? await evaluateNodeAsync(node.right, checker) : false;
    }
    case 'or': {
      const left = await evaluateNodeAsync(node.left, checker);
      return left ? true : await evaluateNodeAsync(node.right, checker);
    }
  }
};

/** Evaluates the AST asynchronously using `checker` for each literal. Short-circuits like `&&`/`||`. */
export const evaluateAsync = async (
  node: AstNode,
  checker: AsyncTokenChecker,
): Promise<boolean> => {
  if (typeof checker !== 'function') {
    throw new TypeError(
      `Expected checker to be a function, got ${checker === null ? 'null' : typeof checker}`,
    );
  }
  return evaluateNodeAsync(node, checker);
};
