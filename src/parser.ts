import { type Token } from './tokenizer.js';
import { type AstNode, type CustomOperatorRegistry } from './ast.js';

/** Thrown for malformed expressions. `instanceof SyntaxError`; carries the char `offset`. */
export class LEPSyntaxError extends SyntaxError {
  readonly offset: number;

  constructor(message: string, offset: number) {
    super(`${message} (at offset ${offset})`);
    this.offset = offset;
  }
}

interface ResolvedBinaryOperator {
  readonly isBuiltin: boolean;
  readonly type: 'and' | 'or' | 'custom_binary';
  readonly symbol: string;
  readonly precedence: number;
  readonly associativity: 'left' | 'right';
}

/**
 * Precedence-climbing parser over the token stream.
 *
 * Supports built-in operators:
 *   - '!' (prefix, precedence 30)
 *   - '&' (binary, precedence 20, left-associative)
 *   - '|' (binary, precedence 10, left-associative)
 *   - '(...)' (grouping)
 * Along with user-registered custom prefix and binary operators.
 */
class Parser {
  private position = 0;

  constructor(
    private readonly tokens: readonly Token[],
    private readonly inputLength: number,
    private readonly registry?: CustomOperatorRegistry,
  ) {}

  parse(): AstNode {
    if (this.tokens.length === 0) {
      throw new LEPSyntaxError('Empty expression', 0);
    }
    const node = this.parseExpression(0);
    const trailing = this.peek();
    if (trailing) {
      throw new LEPSyntaxError(`Unexpected '${trailing.value}'`, trailing.offset);
    }
    return node;
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private getBinaryOperator(token: Token): ResolvedBinaryOperator | undefined {
    if (token.type === 'and') {
      return {
        isBuiltin: true,
        type: 'and',
        symbol: '&',
        precedence: 20,
        associativity: 'left',
      };
    }
    if (token.type === 'or') {
      return {
        isBuiltin: true,
        type: 'or',
        symbol: '|',
        precedence: 10,
        associativity: 'left',
      };
    }
    if (token.type === 'custom' && this.registry) {
      const customOp = this.registry.binary.get(token.value);
      if (customOp) {
        return {
          isBuiltin: false,
          type: 'custom_binary',
          symbol: customOp.symbol,
          precedence: customOp.precedence,
          associativity: customOp.associativity ?? 'left',
        };
      }
    }
    return undefined;
  }

  private parseExpression(minPrecedence: number): AstNode {
    let left = this.parsePrefix();

    while (true) {
      const token = this.peek();
      if (!token) {
        break;
      }

      const binaryOp = this.getBinaryOperator(token);
      if (!binaryOp || binaryOp.precedence < minPrecedence) {
        break;
      }

      this.position += 1;

      const nextMinPrecedence =
        binaryOp.associativity === 'right'
          ? binaryOp.precedence
          : binaryOp.precedence + 1;

      const right = this.parseExpression(nextMinPrecedence);

      if (binaryOp.isBuiltin) {
        left = {
          type: binaryOp.type as 'and' | 'or',
          left,
          right,
        };
      } else {
        left = {
          type: 'custom_binary',
          operator: binaryOp.symbol,
          left,
          right,
        };
      }
    }

    return left;
  }

  private parsePrefix(): AstNode {
    const token = this.peek();
    if (!token) {
      throw new LEPSyntaxError(
        "Unexpected end of input, expected a literal or '('",
        this.inputLength,
      );
    }

    if (token.type === 'not') {
      this.position += 1;
      return {
        type: 'not',
        operand: this.parseExpression(30),
      };
    }

    if (token.type === 'custom' && this.registry) {
      const unaryOp = this.registry.unary.get(token.value);
      if (unaryOp) {
        this.position += 1;
        const prec = unaryOp.precedence ?? 30;
        return {
          type: 'custom_unary',
          operator: unaryOp.symbol,
          operand: this.parseExpression(prec),
        };
      }
    }

    return this.parseAtom();
  }

  private parseAtom(): AstNode {
    const token = this.tokens[this.position++];
    if (token.type === 'literal') {
      return { type: 'literal', value: token.value };
    }
    if (token.type === 'lparen') {
      const inner = this.parseExpression(0);
      const closing = this.peek();
      if (!closing) {
        throw new LEPSyntaxError("Missing ')'", this.inputLength);
      }
      if (closing.type !== 'rparen') {
        throw new LEPSyntaxError(
          `Expected ')' but found '${closing.value}'`,
          closing.offset,
        );
      }
      this.position += 1;
      return inner;
    }
    throw new LEPSyntaxError(`Unexpected '${token.value}'`, token.offset);
  }
}

export const parseTokens = (
  tokens: readonly Token[],
  inputLength: number,
  registry?: CustomOperatorRegistry,
): AstNode => new Parser(tokens, inputLength, registry).parse();
