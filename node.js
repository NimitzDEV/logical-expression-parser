const TokenType = require('./token-type');

class ExpNode {
  constructor(op, left, right, literal) {
    this.op = op;
    this.left = left;
    this.right = right;
    this.literal = literal;
  }

  isLeaf() {
    return this.op === TokenType.LEAF;
  }

  isAtomic() {
    return (
      this.isLeaf() || (this.op === TokenType.OP_NOT && this.left.isLeaf())
    );
  }

  getLiteralValue() {
    return this.literal;
  }

  static CreateAnd(left, right) {
    return new ExpNode(TokenType.BINARY_AND, left, right);
  }

  static CreateNot(exp) {
    return new ExpNode(TokenType.OP_NOT, exp);
  }

  static CreateOr(left, right) {
    return new ExpNode(TokenType.BINARY_OR, left, right);
  }

  static CreateLiteral(lit) {
    return new ExpNode(TokenType.LEAF, null, null, lit);
  }
}

// 抽象语法树生成
const make = gen => {
  const data = gen.next().value;

  switch (data.type) {
    case TokenType.LITERAL:
      return ExpNode.CreateLiteral(data.value);
    case TokenType.OP_NOT:
      return ExpNode.CreateNot(make(gen));
    case TokenType.BINARY_AND: {
      const left = make(gen);
      const right = make(gen);
      return ExpNode.CreateAnd(left, right);
    }
    case TokenType.BINARY_OR: {
      const left = make(gen);
      const right = make(gen);
      return ExpNode.CreateOr(left, right);
    }
  }
  return null;
};

// 语法树求值
const nodeEvaluator = (tree, literalEvaluator) => {
  if (tree.isLeaf()) {
    return literalEvaluator(tree.getLiteralValue());
  }

  if (tree.op === TokenType.OP_NOT) {
    return !nodeEvaluator(tree.left, literalEvaluator);
  }

  if (tree.op === TokenType.BINARY_OR) {
    return (
      nodeEvaluator(tree.left, literalEvaluator) ||
      nodeEvaluator(tree.right, literalEvaluator)
    );
  }

  if (tree.op === TokenType.BINARY_AND) {
    return (
      nodeEvaluator(tree.left, literalEvaluator) &&
      nodeEvaluator(tree.right, literalEvaluator)
    );
  }
};

module.exports = {
  make,
  nodeEvaluator
};
