import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LEPSyntaxError, parse, parseAst } from '../src/index.js';

const expectSyntaxError = (expression: string, expectedOffset: number) => {
  // Regression guard: v1 crashed with raw TypeError or silently accepted these.
  assert.throws(
    () => parse(expression, () => true),
    SyntaxError,
    `${expression} should throw SyntaxError`,
  );
  assert.throws(
    () => parseAst(expression),
    (error: unknown): boolean => {
      if (!(error instanceof SyntaxError)) return false;
      if (!('offset' in error)) return false;
      return error.offset === expectedOffset;
    },
    `${expression} should report offset ${expectedOffset}`,
  );
};

test('empty and whitespace-only expressions', () => {
  expectSyntaxError('', 0);
  expectSyntaxError('   ', 0);
});

test('empty parentheses', () => {
  expectSyntaxError('()', 1);
  expectSyntaxError('( )', 2);
});

test('dangling and leading operators', () => {
  expectSyntaxError('A&', 2);
  expectSyntaxError('A|', 2);
  expectSyntaxError('&A', 0);
  expectSyntaxError('|A', 0);
  expectSyntaxError('A&&B', 2);
  expectSyntaxError('!A&', 3);
  expectSyntaxError('!', 1);
});

test('unbalanced parentheses', () => {
  expectSyntaxError('A&(B|C', 6);
  expectSyntaxError('(A', 2);
});

test('stray closing parentheses', () => {
  expectSyntaxError('A)', 1);
  expectSyntaxError('A))', 1);
});

test('misplaced tokens', () => {
  expectSyntaxError('A(B)', 1);
  expectSyntaxError('A B', 2);
  expectSyntaxError('A ! B', 2);
});

test('unclosed parenthesis before another token', () => {
  expectSyntaxError('(A B)', 3);
  expectSyntaxError('(A!', 2);
});

test('LEPSyntaxError is a SyntaxError subclass carrying the offset', () => {
  const error = new LEPSyntaxError('boom', 7);
  assert.ok(error instanceof SyntaxError);
  assert.equal(error.name, 'SyntaxError');
  assert.equal(error.offset, 7);
  assert.equal(error.message, 'boom (at offset 7)');
});

test('error message reports the offset', () => {
  assert.throws(
    () => parseAst('A)'),
    (error: unknown): boolean =>
      error instanceof SyntaxError && error.message.endsWith('at offset 1)'),
  );
});
