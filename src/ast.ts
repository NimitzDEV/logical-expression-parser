export type LiteralNode = { readonly type: 'literal'; readonly value: string };
export type NotNode = { readonly type: 'not'; readonly operand: AstNode };
export type BinaryNode = {
  readonly type: 'and' | 'or';
  readonly left: AstNode;
  readonly right: AstNode;
};
export type CustomBinaryNode = {
  readonly type: 'custom_binary';
  readonly operator: string;
  readonly left: AstNode;
  readonly right: AstNode;
};
export type CustomUnaryNode = {
  readonly type: 'custom_unary';
  readonly operator: string;
  readonly operand: AstNode;
};
export type AstNode =
  | LiteralNode
  | NotNode
  | BinaryNode
  | CustomBinaryNode
  | CustomUnaryNode;

export type TokenChecker = (token: string) => boolean;
export type AsyncTokenChecker = (token: string) => boolean | Promise<boolean>;

export type Associativity = 'left' | 'right';

export interface CustomBinaryOperator {
  readonly kind: 'binary';
  readonly symbol: string;
  /**
   * Precedence level. Higher numbers bind tighter.
   * Built-in references:
   *   '|' (OR)   = 10
   *   '&' (AND)  = 20
   *   '!' (NOT)  = 30
   */
  readonly precedence: number;
  readonly associativity?: Associativity;
  readonly evaluate: (left: boolean, right: () => boolean) => boolean;
  readonly evaluateAsync?: (
    left: boolean,
    right: () => Promise<boolean>,
  ) => Promise<boolean>;
}

export interface CustomUnaryOperator {
  readonly kind: 'prefix';
  readonly symbol: string;
  /** Precedence level. Defaults to 30 (same as '!'). */
  readonly precedence?: number;
  readonly evaluate: (operand: boolean) => boolean;
  readonly evaluateAsync?: (operand: Promise<boolean>) => Promise<boolean>;
}

export type CustomOperator = CustomBinaryOperator | CustomUnaryOperator;

export interface CustomOperatorRegistry {
  readonly binary: ReadonlyMap<string, CustomBinaryOperator>;
  readonly unary: ReadonlyMap<string, CustomUnaryOperator>;
}

const RESERVED_SYMBOLS = new Set(['(', ')', '!', '&', '|']);

export const buildOperatorRegistry = (
  operators?: readonly CustomOperator[],
): CustomOperatorRegistry => {
  const binary = new Map<string, CustomBinaryOperator>();
  const unary = new Map<string, CustomUnaryOperator>();

  if (!operators) {
    return { binary, unary };
  }

  for (const op of operators) {
    if (!op || typeof op.symbol !== 'string' || op.symbol.trim().length === 0) {
      throw new Error('Custom operator must have a non-empty symbol string');
    }
    if (/\s/.test(op.symbol)) {
      throw new Error(
        `Invalid operator symbol '${op.symbol}': symbol cannot contain whitespace`,
      );
    }
    if (op.symbol.includes('(') || op.symbol.includes(')')) {
      throw new Error(
        `Invalid operator symbol '${op.symbol}': symbol cannot contain parentheses`,
      );
    }
    if (RESERVED_SYMBOLS.has(op.symbol)) {
      throw new Error(
        `Invalid operator symbol '${op.symbol}': cannot override reserved built-in operator`,
      );
    }
    if (typeof op.evaluate !== 'function') {
      throw new TypeError(
        `Custom operator '${op.symbol}' must provide an evaluate function`,
      );
    }
    if (
      op.evaluateAsync !== undefined &&
      typeof op.evaluateAsync !== 'function'
    ) {
      throw new TypeError(
        `Custom operator '${op.symbol}' evaluateAsync must be a function if provided`,
      );
    }

    if (op.kind === 'binary') {
      if (!Number.isFinite(op.precedence)) {
        throw new TypeError(
          `Custom binary operator '${op.symbol}' must have a finite numeric precedence`,
        );
      }
      if (
        op.associativity !== undefined &&
        op.associativity !== 'left' &&
        op.associativity !== 'right'
      ) {
        throw new TypeError(
          `Custom binary operator '${op.symbol}' associativity must be 'left' or 'right'`,
        );
      }
      if (binary.has(op.symbol) || unary.has(op.symbol)) {
        throw new Error(`Duplicate custom operator '${op.symbol}'`);
      }
      binary.set(op.symbol, op);
    } else if (op.kind === 'prefix') {
      if (op.precedence !== undefined && !Number.isFinite(op.precedence)) {
        throw new TypeError(
          `Custom unary operator '${op.symbol}' must have a finite numeric precedence if provided`,
        );
      }
      if (unary.has(op.symbol) || binary.has(op.symbol)) {
        throw new Error(`Duplicate custom operator '${op.symbol}'`);
      }
      unary.set(op.symbol, op);
    } else {
      throw new Error(`Invalid operator kind for '${(op as any)?.symbol}'`);
    }
  }

  return { binary, unary };
};

export interface EvaluateOptions {
  readonly customOperators?: readonly CustomOperator[];
}

export const evaluateNode = (
  node: AstNode,
  checker: TokenChecker,
  registry?: CustomOperatorRegistry,
): boolean => {
  switch (node.type) {
    case 'literal':
      return checker(node.value);
    case 'not':
      return !evaluateNode(node.operand, checker, registry);
    case 'and':
      return (
        evaluateNode(node.left, checker, registry) &&
        evaluateNode(node.right, checker, registry)
      );
    case 'or':
      return (
        evaluateNode(node.left, checker, registry) ||
        evaluateNode(node.right, checker, registry)
      );
    case 'custom_binary': {
      const op = registry?.binary.get(node.operator);
      if (!op) {
        throw new Error(`Unknown custom binary operator '${node.operator}'`);
      }
      const left = evaluateNode(node.left, checker, registry);
      return op.evaluate(left, () =>
        evaluateNode(node.right, checker, registry),
      );
    }
    case 'custom_unary': {
      const op = registry?.unary.get(node.operator);
      if (!op) {
        throw new Error(`Unknown custom unary operator '${node.operator}'`);
      }
      const operand = evaluateNode(node.operand, checker, registry);
      return op.evaluate(operand);
    }
  }
};

/** Evaluates the AST using `checker` for each literal. Short-circuits like `&&`/`||`. */
export const evaluate = (
  node: AstNode,
  checker: TokenChecker,
  options?: EvaluateOptions,
): boolean => {
  if (typeof checker !== 'function') {
    throw new TypeError(
      `Expected checker to be a function, got ${checker === null ? 'null' : typeof checker}`,
    );
  }
  const registry = options?.customOperators
    ? buildOperatorRegistry(options.customOperators)
    : undefined;
  return evaluateNode(node, checker, registry);
};

export const evaluateNodeAsync = async (
  node: AstNode,
  checker: AsyncTokenChecker,
  registry?: CustomOperatorRegistry,
): Promise<boolean> => {
  switch (node.type) {
    case 'literal':
      return Boolean(await checker(node.value));
    case 'not':
      return !(await evaluateNodeAsync(node.operand, checker, registry));
    case 'and': {
      const left = await evaluateNodeAsync(node.left, checker, registry);
      return left
        ? await evaluateNodeAsync(node.right, checker, registry)
        : false;
    }
    case 'or': {
      const left = await evaluateNodeAsync(node.left, checker, registry);
      return left
        ? true
        : await evaluateNodeAsync(node.right, checker, registry);
    }
    case 'custom_binary': {
      const op = registry?.binary.get(node.operator);
      if (!op) {
        throw new Error(`Unknown custom binary operator '${node.operator}'`);
      }
      if (!op.evaluateAsync) {
        throw new TypeError(
          `Custom binary operator '${node.operator}' does not implement evaluateAsync`,
        );
      }
      const left = await evaluateNodeAsync(node.left, checker, registry);
      return await op.evaluateAsync(left, () =>
        evaluateNodeAsync(node.right, checker, registry),
      );
    }
    case 'custom_unary': {
      const op = registry?.unary.get(node.operator);
      if (!op) {
        throw new Error(`Unknown custom unary operator '${node.operator}'`);
      }
      if (!op.evaluateAsync) {
        throw new TypeError(
          `Custom unary operator '${node.operator}' does not implement evaluateAsync`,
        );
      }
      const operand = evaluateNodeAsync(node.operand, checker, registry);
      return await op.evaluateAsync(operand);
    }
  }
};

/** Evaluates the AST asynchronously using `checker` for each literal. Short-circuits like `&&`/`||`. */
export const evaluateAsync = async (
  node: AstNode,
  checker: AsyncTokenChecker,
  options?: EvaluateOptions,
): Promise<boolean> => {
  if (typeof checker !== 'function') {
    throw new TypeError(
      `Expected checker to be a function, got ${checker === null ? 'null' : typeof checker}`,
    );
  }
  const registry = options?.customOperators
    ? buildOperatorRegistry(options.customOperators)
    : undefined;
  return evaluateNodeAsync(node, checker, registry);
};
