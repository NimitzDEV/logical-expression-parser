import { readFileSync } from 'node:fs';

const packageVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;
const tag = process.env.GITHUB_REF_NAME ?? '';
const expected = `v${packageVersion}`;

if (tag !== expected) {
  console.error(
    `Release tag ${tag} does not match package.json version ${packageVersion} (expected ${expected}).`,
  );
  process.exit(1);
}

console.log(`Tag ${tag} matches package.json version ${packageVersion}.`);
