import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse } from '../src/index.js';

const truthy = (...tokens: string[]) => (token: string): boolean => tokens.includes(token);

test('single literal', () => {
  assert.equal(parse('A', truthy('A')), true);
  assert.equal(parse('A', truthy('B')), false);
});

test('README example', () => {
  const REQUIREMENTS = 'REGISTED&(SPECIAL|INVITED)';
  const LIST_A = ['REGISTED', 'INVITED'];
  const LIST_B = ['SPECIAL', 'EXPERT'];
  assert.equal(parse(REQUIREMENTS, token => LIST_A.includes(token)), true);
  assert.equal(parse(REQUIREMENTS, token => LIST_B.includes(token)), false);
});

test('AND', () => {
  assert.equal(parse('A&B', truthy('A', 'B')), true);
  assert.equal(parse('A&B', truthy('A')), false);
  assert.equal(parse('A&B', truthy('B')), false);
});

test('OR', () => {
  assert.equal(parse('A|B', truthy('A')), true);
  assert.equal(parse('A|B', truthy('B')), true);
  assert.equal(parse('A|B', truthy('C')), false);
});

test('NOT', () => {
  assert.equal(parse('!A', truthy()), true);
  assert.equal(parse('!A', truthy('A')), false);
  assert.equal(parse('!!A', truthy('A')), true);
  assert.equal(parse('!!A', truthy()), false);
});

// Regression: v1 bound `!` to the wrong operand (`!A&B` evaluated as `A&!B`).
test('NOT binds tighter than AND', () => {
  assert.equal(parse('!A&B', truthy('B')), true);
  assert.equal(parse('!A&B', truthy('A', 'B')), false);
  assert.equal(parse('A&!B', truthy('A')), true);
  assert.equal(parse('A&!B', truthy('A', 'B')), false);
});

// Regression: v1 bound `!` to the whole following group (`A|!B` evaluated as `!(A|B)`).
test('NOT binds tighter than OR', () => {
  assert.equal(parse('!A|B', truthy('A')), false);
  assert.equal(parse('!A|B', truthy('B')), true);
  assert.equal(parse('A|!B', truthy('A', 'B')), true);
  assert.equal(parse('A|!B', truthy('B')), false);
});

// Regression: v1 had no precedence (`A&B|C` evaluated as `A|(B&C)`).
test('AND binds tighter than OR', () => {
  assert.equal(parse('A&B|C', truthy('A')), false);
  assert.equal(parse('A&B|C', truthy('B', 'C')), true);
  assert.equal(parse('A|B&C', truthy('B', 'C')), true);
  assert.equal(parse('A|B&C', truthy('A')), true);
  assert.equal(parse('A|B&C', truthy('B')), false);
  assert.equal(parse('A&B|C&D', truthy('C', 'D')), true);
  assert.equal(parse('A&B|C&D', truthy('B', 'C')), false);
});

test('parentheses override precedence', () => {
  assert.equal(parse('(A|B)&C', truthy('A', 'C')), true);
  assert.equal(parse('(A|B)&C', truthy('A')), false);
  assert.equal(parse('A&(B|C)', truthy('A', 'B')), true);
  assert.equal(parse('!(A|B)', truthy()), true);
  assert.equal(parse('!(A&B)', truthy('A')), true);
  assert.equal(parse('!(A&B)', truthy('A', 'B')), false);
  assert.equal(parse('((A|B)&(C|D))|E', truthy('E')), true);
});

test('De Morgan laws hold for every environment', () => {
  for (const a of [false, true]) {
    for (const b of [false, true]) {
      const env: Record<string, boolean> = { A: a, B: b };
      const checker = (token: string): boolean => Boolean(env[token]);
      assert.equal(
        parse('!(A|B)', checker),
        parse('!A&!B', checker),
        `!(A|B) vs !A&!B with ${JSON.stringify(env)}`,
      );
      assert.equal(
        parse('!(A&B)', checker),
        parse('!A|!B', checker),
        `!(A&B) vs !A|!B with ${JSON.stringify(env)}`,
      );
    }
  }
});

test('whitespace is ignored between tokens', () => {
  assert.equal(parse(' A & ( B | C ) ', truthy('A', 'B')), true);
  assert.equal(parse('A\t&\nB', truthy('A')), false);
});

test('literals may contain unicode and emoji', () => {
  assert.equal(parse('日本語&X', token => token === '日本語' || token === 'X'), true);
  assert.equal(parse('🚀|A', truthy('🚀')), true);
});

test('literals matching Object.prototype properties parse correctly', () => {
  const objectProps = ['toString', 'valueOf', 'constructor', 'hasOwnProperty', '__proto__'];
  for (const prop of objectProps) {
    assert.equal(parse(prop, token => token === prop), true, `literal ${prop}`);
    assert.equal(
      parse(`A&${prop}`, token => token === 'A' || token === prop),
      true,
      `composite with ${prop}`,
    );
  }
});

test('checker receives the exact literal text', () => {
  const seen: string[] = [];
  parse('A & B', token => {
    seen.push(token);
    return true;
  });
  assert.deepEqual(seen, ['A', 'B']);
});

test('evaluation short-circuits', () => {
  const seen: string[] = [];
  const checker = (result: boolean) => (token: string): boolean => {
    seen.push(token);
    return result;
  };

  // OR: true on the left skips the right operand.
  seen.length = 0;
  assert.equal(parse('A|B', checker(true)), true);
  assert.deepEqual(seen, ['A']);

  // AND: false on the left skips the right operand.
  seen.length = 0;
  assert.equal(parse('A&B', checker(false)), false);
  assert.deepEqual(seen, ['A']);

  // Parenthesized groups short-circuit as wholes.
  seen.length = 0;
  assert.equal(parse('A&(B|C)', checker(false)), false);
  assert.deepEqual(seen, ['A']);

  // NOT flips the left operand before the OR decision.
  seen.length = 0;
  assert.equal(parse('!A|B', checker(false)), true);
  assert.deepEqual(seen, ['A']);
  // A true => !A false => B must be evaluated.
  seen.length = 0;
  const aTrueRestFalse = (token: string): boolean => {
    seen.push(token);
    return token === 'A';
  };
  assert.equal(parse('!A|B', aTrueRestFalse), false);
  assert.deepEqual(seen, ['A', 'B']);
});

test('parseAsync evaluates expressions with async checkers', async () => {
  const { parseAsync } = await import('../src/index.js');
  const userRoles = new Set(['ADMIN', 'BETA_TESTER']);
  const asyncChecker = async (role: string): Promise<boolean> => {
    await new Promise(resolve => setImmediate(resolve));
    return userRoles.has(role);
  };

  assert.equal(await parseAsync('ADMIN & BETA_TESTER', asyncChecker), true);
  assert.equal(await parseAsync('ADMIN & SUPERUSER', asyncChecker), false);
  assert.equal(await parseAsync('!SUPERUSER & (ADMIN | GUEST)', asyncChecker), true);
});

test('parseAsync propagates syntax and type errors as rejections', async () => {
  const { parseAsync } = await import('../src/index.js');
  await assert.rejects(async () => parseAsync('A&', async () => true), SyntaxError);
  // @ts-expect-error test invalid expression type
  await assert.rejects(async () => parseAsync(123, async () => true), TypeError);
});

test('concurrent and interleaved evaluations are stateless', async () => {
  const { parseAsync } = await import('../src/index.js');
  const results = await Promise.all([
    parseAsync('A & B', async t => t === 'A' || t === 'B'),
    parseAsync('C | D', async t => t === 'D'),
    parseAsync('!E & F', async t => t === 'F'),
  ]);
  assert.deepEqual(results, [true, true, true]);
});
