import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

assert.ok(
  existsSync(new URL('../dist/cjs/index.d.ts', import.meta.url)),
  'missing dist/cjs/index.d.ts',
);

const esm = await import('../dist/esm/index.js');
const cjs = require('../dist/cjs/index.js');

for (const [label, mod] of [
  ['esm', esm],
  ['cjs', cjs],
]) {
  assert.equal(typeof mod.parse, 'function', `${label}: parse export`);
  assert.equal(typeof mod.parseAst, 'function', `${label}: parseAst export`);
  assert.equal(typeof mod.evaluate, 'function', `${label}: evaluate export`);
  assert.equal(mod.parse('A&(B|C)', t => t === 'A' || t === 'C'), true, `${label}: evaluation`);
  assert.equal(mod.parse('!(A&B)', t => t === 'A'), true, `${label}: NOT semantics`);
  assert.equal(mod.parse('A&B|C', t => t === 'C'), true, `${label}: precedence`);
  assert.deepEqual(
    mod.parseAst('!A'),
    { type: 'not', operand: { type: 'literal', value: 'A' } },
    `${label}: AST`,
  );
}

console.log('smoke OK: dist/cjs and dist/esm behave identically');
