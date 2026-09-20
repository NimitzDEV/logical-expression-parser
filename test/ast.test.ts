import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluate, parse, parseAst, type AstNode } from '../src/index.js';

test('parseAst builds a discriminated-union AST', () => {
  assert.deepEqual(parseAst('!A'), {
    type: 'not',
    operand: { type: 'literal', value: 'A' },
  });
  assert.deepEqual(parseAst('A&B'), {
    type: 'and',
    left: { type: 'literal', value: 'A' },
    right: { type: 'literal', value: 'B' },
  });
  assert.deepEqual(parseAst('!(A|B)'), {
    type: 'not',
    operand: {
      type: 'or',
      left: { type: 'literal', value: 'A' },
      right: { type: 'literal', value: 'B' },
    },
  });
});

// Regression: v1 produced `A|(B&C)` for this input.
test('AND binds tighter than OR in the AST', () => {
  assert.deepEqual(parseAst('A&B|C'), {
    type: 'or',
    left: {
      type: 'and',
      left: { type: 'literal', value: 'A' },
      right: { type: 'literal', value: 'B' },
    },
    right: { type: 'literal', value: 'C' },
  });
});

test('binary operators are left-associative', () => {
  assert.deepEqual(parseAst('A|B|C'), {
    type: 'or',
    left: {
      type: 'or',
      left: { type: 'literal', value: 'A' },
      right: { type: 'literal', value: 'B' },
    },
    right: { type: 'literal', value: 'C' },
  });
  assert.deepEqual(parseAst('A&B&C'), {
    type: 'and',
    left: {
      type: 'and',
      left: { type: 'literal', value: 'A' },
      right: { type: 'literal', value: 'B' },
    },
    right: { type: 'literal', value: 'C' },
  });
});

test('evaluate consumes a parsed AST', () => {
  const ast: AstNode = parseAst('REGISTED&!(BANNED)');
  assert.equal(evaluate(ast, token => token === 'REGISTED'), true);
  assert.equal(evaluate(ast, token => ['REGISTED', 'BANNED'].includes(token)), false);
});

test('parse(expression, checker) equals evaluate(parseAst(expression), checker)', () => {
  const expressions = ['A', '!A', 'A&B', 'A|B', '!(A|B)&C', 'A&!B|C'];
  const env: Record<string, boolean> = { A: true, B: false, C: true };
  for (const expression of expressions) {
    assert.equal(
      parse(expression, token => Boolean(env[token])),
      evaluate(parseAst(expression), token => Boolean(env[token])),
      expression,
    );
  }
});

test('evaluateAsync consumes a parsed AST with async checkers', async () => {
  const { evaluateAsync } = await import('../src/index.js');
  const ast: AstNode = parseAst('REGISTED&!(BANNED)');
  const asyncChecker = async (token: string): Promise<boolean> => {
    await new Promise(resolve => setImmediate(resolve));
    return token === 'REGISTED';
  };
  assert.equal(await evaluateAsync(ast, asyncChecker), true);
  assert.equal(
    await evaluateAsync(ast, async token => ['REGISTED', 'BANNED'].includes(token)),
    false,
  );
});

test('evaluateAsync short-circuits like evaluate', async () => {
  const { evaluateAsync } = await import('../src/index.js');
  const seen: string[] = [];
  const checker = (result: boolean) => async (token: string): Promise<boolean> => {
    seen.push(token);
    return result;
  };

  seen.length = 0;
  assert.equal(await evaluateAsync(parseAst('A|B'), checker(true)), true);
  assert.deepEqual(seen, ['A']);

  seen.length = 0;
  assert.equal(await evaluateAsync(parseAst('A&B'), checker(false)), false);
  assert.deepEqual(seen, ['A']);
});

test('evaluate and evaluateAsync throw TypeError on non-function checker', async () => {
  const { evaluateAsync } = await import('../src/index.js');
  const ast = parseAst('A');
  // @ts-expect-error test invalid checker
  assert.throws(() => evaluate(ast, null), TypeError);
  // @ts-expect-error test invalid checker
  assert.throws(() => evaluate(ast, 'not-a-fn'), TypeError);
  // @ts-expect-error test invalid checker
  await assert.rejects(async () => evaluateAsync(ast, null), TypeError);
  // @ts-expect-error test invalid checker
  await assert.rejects(async () => evaluateAsync(ast, 'not-a-fn'), TypeError);
});
