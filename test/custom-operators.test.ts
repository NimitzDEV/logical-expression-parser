import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createParser,
  evaluate,
  evaluateAsync,
  type CustomBinaryOperator,
  type CustomUnaryOperator,
} from '../src/index.js';

test('custom binary operator (XOR ^) with intermediate precedence', () => {
  const xorOp: CustomBinaryOperator = {
    kind: 'binary',
    symbol: '^',
    precedence: 15, // between OR (10) and AND (20)
    associativity: 'left',
    evaluate: (left, right) => left !== right(),
    evaluateAsync: async (left, right) => left !== (await right()),
  };

  const parser = createParser({ customOperators: [xorOp] });

  // AND binds tighter than XOR: A ^ B & C => A ^ (B & C)
  assert.deepEqual(parser.parseAst('A ^ B & C'), {
    type: 'custom_binary',
    operator: '^',
    left: { type: 'literal', value: 'A' },
    right: {
      type: 'and',
      left: { type: 'literal', value: 'B' },
      right: { type: 'literal', value: 'C' },
    },
  });

  // XOR binds tighter than OR: A | B ^ C => A | (B ^ C)
  assert.deepEqual(parser.parseAst('A | B ^ C'), {
    type: 'or',
    left: { type: 'literal', value: 'A' },
    right: {
      type: 'custom_binary',
      operator: '^',
      left: { type: 'literal', value: 'B' },
      right: { type: 'literal', value: 'C' },
    },
  });

  // Evaluation
  const env: Record<string, boolean> = { A: true, B: true, C: false };
  const checker = (t: string) => Boolean(env[t]);

  assert.equal(parser.parse('A ^ B', checker), false);
  assert.equal(parser.parse('A ^ C', checker), true);
  assert.equal(parser.parse('C ^ A', checker), true);
  assert.equal(parser.parse('C ^ C', checker), false);
});

test('right-associative binary operator (Implication ->)', () => {
  const impliesOp: CustomBinaryOperator = {
    kind: 'binary',
    symbol: '->',
    precedence: 5, // looser than OR (10)
    associativity: 'right',
    evaluate: (left, right) => (!left ? true : right()),
    evaluateAsync: async (left, right) => (!left ? true : await right()),
  };

  const parser = createParser({ customOperators: [impliesOp] });

  // Right-associative: A -> B -> C => A -> (B -> C)
  assert.deepEqual(parser.parseAst('A -> B -> C'), {
    type: 'custom_binary',
    operator: '->',
    left: { type: 'literal', value: 'A' },
    right: {
      type: 'custom_binary',
      operator: '->',
      left: { type: 'literal', value: 'B' },
      right: { type: 'literal', value: 'C' },
    },
  });

  // Short-circuiting verification: if left is false, right should NOT be evaluated
  const seen: string[] = [];
  const checker = (token: string): boolean => {
    seen.push(token);
    return token === 'A_FALSE' ? false : true;
  };

  seen.length = 0;
  assert.equal(parser.parse('A_FALSE -> (B & C)', checker), true);
  assert.deepEqual(seen, ['A_FALSE']);
});

test('word operators (e.g. XOR, NAND) with word boundary safety', () => {
  const xorWordOp: CustomBinaryOperator = {
    kind: 'binary',
    symbol: 'XOR',
    precedence: 15,
    evaluate: (left, right) => left !== right(),
    evaluateAsync: async (left, right) => left !== (await right()),
  };

  const parser = createParser({ customOperators: [xorWordOp] });

  assert.deepEqual(parser.parseAst('A XOR B'), {
    type: 'custom_binary',
    operator: 'XOR',
    left: { type: 'literal', value: 'A' },
    right: { type: 'literal', value: 'B' },
  });

  // Literals containing the word as a substring must NOT be split
  assert.deepEqual(parser.parseAst('XOR_VAR & B'), {
    type: 'and',
    left: { type: 'literal', value: 'XOR_VAR' },
    right: { type: 'literal', value: 'B' },
  });
});

test('custom prefix unary operator (~)', () => {
  const tildeOp: CustomUnaryOperator = {
    kind: 'prefix',
    symbol: '~',
    precedence: 30,
    evaluate: operand => !operand,
    evaluateAsync: async operand => !(await operand),
  };

  const parser = createParser({ customOperators: [tildeOp] });

  assert.deepEqual(parser.parseAst('~A & B'), {
    type: 'and',
    left: {
      type: 'custom_unary',
      operator: '~',
      operand: { type: 'literal', value: 'A' },
    },
    right: { type: 'literal', value: 'B' },
  });

  assert.equal(parser.parse('~A', t => t === 'A'), false);
  assert.equal(parser.parse('~A', () => false), true);
});

test('async evaluation with custom operators (sync and async checker)', async () => {
  const xorOp: CustomBinaryOperator = {
    kind: 'binary',
    symbol: '^',
    precedence: 15,
    evaluate: (left, right) => left !== right(),
    evaluateAsync: async (left, right) => left !== (await right()),
  };

  const tildeOp: CustomUnaryOperator = {
    kind: 'prefix',
    symbol: '~',
    precedence: 30,
    evaluate: operand => !operand,
    evaluateAsync: async operand => !(await operand),
  };

  const parser = createParser({ customOperators: [xorOp, tildeOp] });

  const asyncChecker = async (token: string): Promise<boolean> => {
    await new Promise(resolve => setImmediate(resolve));
    return token === 'ROLE_A';
  };

  assert.equal(await parser.parseAsync('ROLE_A ^ ROLE_B', asyncChecker), true);
  assert.equal(await parser.parseAsync('~ROLE_A', asyncChecker), false);
  assert.equal(await parser.parseAsync('~ROLE_B', asyncChecker), true);
});

test('standalone evaluate and evaluateAsync with options.customOperators', async () => {
  const xorOp: CustomBinaryOperator = {
    kind: 'binary',
    symbol: '^',
    precedence: 15,
    evaluate: (left, right) => left !== right(),
    evaluateAsync: async (left, right) => left !== (await right()),
  };

  const parser = createParser({ customOperators: [xorOp] });
  const ast = parser.parseAst('A ^ B');

  assert.equal(evaluate(ast, t => t === 'A', { customOperators: [xorOp] }), true);
  assert.equal(
    await evaluateAsync(ast, async t => t === 'A', { customOperators: [xorOp] }),
    true,
  );
});

test('error handling when custom operator lacks evaluateAsync in async mode', async () => {
  const syncOnlyBinary: CustomBinaryOperator = {
    kind: 'binary',
    symbol: '<=>',
    precedence: 15,
    evaluate: (l, r) => l === r(),
  };

  const syncOnlyUnary: CustomUnaryOperator = {
    kind: 'prefix',
    symbol: '?',
    evaluate: op => op,
  };

  const parser = createParser({ customOperators: [syncOnlyBinary, syncOnlyUnary] });
  await assert.rejects(
    async () => parser.parseAsync('A <=> B', async () => true),
    TypeError,
  );
  await assert.rejects(
    async () => parser.parseAsync('?A', async () => true),
    TypeError,
  );
});

test('validation of invalid operator definitions', () => {
  // Empty symbol
  // @ts-expect-error test invalid symbol
  assert.throws(() => createParser({ customOperators: [{ kind: 'binary', symbol: '', evaluate: () => true }] }), Error);
  // @ts-expect-error test whitespace symbol
  assert.throws(() => createParser({ customOperators: [{ kind: 'binary', symbol: '   ', evaluate: () => true }] }), Error);
  // Symbol with whitespace
  // @ts-expect-error test whitespace in symbol
  assert.throws(() => createParser({ customOperators: [{ kind: 'binary', symbol: 'A B', evaluate: () => true }] }), Error);
  // Symbol with parenthesis
  // @ts-expect-error test parenthesis in symbol
  assert.throws(() => createParser({ customOperators: [{ kind: 'binary', symbol: '(^)', evaluate: () => true }] }), Error);
  // Reserved built-in symbol
  assert.throws(() => createParser({ customOperators: [{ kind: 'binary', symbol: '&', precedence: 10, evaluate: () => true }] }), Error);
  assert.throws(() => createParser({ customOperators: [{ kind: 'prefix', symbol: '!', evaluate: () => true }] }), Error);
  // Non-function evaluate
  // @ts-expect-error test invalid evaluate
  assert.throws(() => createParser({ customOperators: [{ kind: 'binary', symbol: '^', precedence: 10, evaluate: null }] }), TypeError);
  // Invalid evaluateAsync
  // @ts-expect-error test invalid evaluateAsync
  assert.throws(() => createParser({ customOperators: [{ kind: 'binary', symbol: '^', precedence: 10, evaluate: () => true, evaluateAsync: 123 }] }), TypeError);
  // Non-finite precedence
  assert.throws(() => createParser({ customOperators: [{ kind: 'binary', symbol: '^', precedence: NaN, evaluate: () => true }] }), TypeError);
  // Non-finite precedence for unary
  assert.throws(() => createParser({ customOperators: [{ kind: 'prefix', symbol: '~', precedence: Infinity, evaluate: () => true }] }), TypeError);
  // Invalid associativity
  // @ts-expect-error test invalid associativity
  assert.throws(() => createParser({ customOperators: [{ kind: 'binary', symbol: '^', precedence: 10, associativity: 'middle', evaluate: () => true }] }), TypeError);
  // Duplicate operator symbol
  assert.throws(() => createParser({
    customOperators: [
      { kind: 'binary', symbol: '^', precedence: 10, evaluate: () => true },
      { kind: 'binary', symbol: '^', precedence: 15, evaluate: () => true },
    ],
  }), Error);
  assert.throws(() => createParser({
    customOperators: [
      { kind: 'binary', symbol: 'op', precedence: 10, evaluate: () => true },
      { kind: 'prefix', symbol: 'op', evaluate: () => true },
    ],
  }), Error);
  // Invalid kind
  // @ts-expect-error test invalid kind
  assert.throws(() => createParser({ customOperators: [{ kind: 'postfix', symbol: '?', evaluate: () => true }] }), Error);
});

test('evaluating AST with unregistered custom operator throws Error', async () => {
  const unregBinary = {
    type: 'custom_binary' as const,
    operator: '???',
    left: { type: 'literal' as const, value: 'A' },
    right: { type: 'literal' as const, value: 'B' },
  };
  assert.throws(() => evaluate(unregBinary, () => true), Error);
  await assert.rejects(async () => evaluateAsync(unregBinary, async () => true), Error);

  const unregUnary = {
    type: 'custom_unary' as const,
    operator: '???',
    operand: { type: 'literal' as const, value: 'A' },
  };
  assert.throws(() => evaluate(unregUnary, () => true), Error);
  await assert.rejects(async () => evaluateAsync(unregUnary, async () => true), Error);
});

test('parser instance validates arguments', async () => {
  const parser = createParser();
  // @ts-expect-error test invalid expression
  assert.throws(() => parser.parseAst(null), TypeError);
  // @ts-expect-error test invalid checker
  assert.throws(() => parser.evaluate({ type: 'literal', value: 'A' }, null), TypeError);
  // @ts-expect-error test invalid checker
  assert.throws(() => parser.evaluate({ type: 'literal', value: 'A' }, 'not-a-fn'), TypeError);
  // @ts-expect-error test invalid checker
  await assert.rejects(async () => parser.evaluateAsync({ type: 'literal', value: 'A' }, null), TypeError);
  // @ts-expect-error test invalid checker
  await assert.rejects(async () => parser.evaluateAsync({ type: 'literal', value: 'A' }, 'not-a-fn'), TypeError);
});
