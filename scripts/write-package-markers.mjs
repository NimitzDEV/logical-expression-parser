import { mkdirSync, writeFileSync } from 'node:fs';

// tsc cannot emit per-outDir "type" fields; dual-format resolution needs them.
for (const [dir, type] of [
  ['dist/cjs', 'commonjs'],
  ['dist/esm', 'module'],
]) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/package.json`, `${JSON.stringify({ type }, null, 2)}\n`);
}
