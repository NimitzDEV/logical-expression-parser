import { type Token } from './tokenizer.js';
import { type AstNode } from './ast.js';

/** Thrown for malformed expressions. `instanceof SyntaxError`; carries the char `offset`. */
export class LEPSyntaxError extends SyntaxError {
  readonly offset: number;

  constructor(message: string, offset: number) {
    super(`${message} (at offset ${offset})`);
    this.offset = offset;
  }
}

/**
 * Recursive-descent parser over the token stream.
 *
 * Grammar (all left-associative, `!` binds tightest):
 *   or   := and ('|' and)*
 *   and  := not ('&' not)*
 *   not  := '!' not | atom
 *   atom := literal | '(' or ')'
 */
class Parser {
  private position = 0;

  constructor(
    private readonly tokens: readonly Token[],
    private readonly inputLength: number,
  ) {}

  parse(): AstNode {
    if (this.tokens.length === 0) {
      throw new LEPSyntaxError('Empty expression', 0);
    }
    const node = this.parseOr();
    const trailing = this.peek();
    if (trailing) {
      throw new LEPSyntaxError(`Unexpected '${trailing.value}'`, trailing.offset);
    }
    return node;
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private parseOr(): AstNode {
    let left = this.parseAnd();
    while (this.peek()?.type === 'or') {
      this.position += 1;
      const right = this.parseAnd();
      left = { type: 'or', left, right };
    }
    return left;
  }

  private parseAnd(): AstNode {
    let left = this.parseNot();
    while (this.peek()?.type === 'and') {
      this.position += 1;
      const right = this.parseNot();
      left = { type: 'and', left, right };
    }
    return left;
  }

  private parseNot(): AstNode {
    if (this.peek()?.type === 'not') {
      this.position += 1;
      return { type: 'not', operand: this.parseNot() };
    }
    return this.parseAtom();
  }

  private parseAtom(): AstNode {
    const token = this.tokens[this.position++];
    if (!token) {
      throw new LEPSyntaxError(
        "Unexpected end of input, expected a literal or '('",
        this.inputLength,
      );
    }
    if (token.type === 'literal') {
      return { type: 'literal', value: token.value };
    }
    if (token.type === 'lparen') {
      const inner = this.parseOr();
      const closing = this.peek();
      if (!closing) {
        throw new LEPSyntaxError("Missing ')'", this.inputLength);
      }
      if (closing.type !== 'rparen') {
        throw new LEPSyntaxError(`Expected ')' but found '${closing.value}'`, closing.offset);
      }
      this.position += 1;
      return inner;
    }
    throw new LEPSyntaxError(`Unexpected '${token.value}'`, token.offset);
  }
}

export const parseTokens = (tokens: readonly Token[], inputLength: number): AstNode =>
  new Parser(tokens, inputLength).parse();
