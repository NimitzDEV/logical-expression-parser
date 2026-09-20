# Logical Expression Parser

[![npm version](https://badge.fury.io/js/logical-expression-parser.svg)](https://badge.fury.io/js/logical-expression-parser)

Parses logical expressions like `REGISTED&(SPECIAL|INVITED)` into an AST and evaluates them with your own token checker. Suitable for permissions management. Written in TypeScript, zero runtime dependencies, ships both CommonJS and ESM builds.

## Supported operators

| Operator | Meaning  | Precedence |
| -------- | -------- | ---------- |
| `!`      | Not      | highest    |
| `&`      | And      | middle     |
| `\|`     | Or       | lowest     |
| `(...)`  | Grouping | —          |

- `&` binds tighter than `|`: `A&B|C` means `(A&B)|C`.
- `&` and `|` are left-associative.
- Whitespace between tokens is ignored.
- Literals are any runs of characters other than whitespace and the operators above (unicode included).

## How it works

1. You require permissions such as `REGISTED&(SPECIAL|INVITED)`.
2. The parser builds an AST and passes each literal (`REGISTED`, `SPECIAL`, `INVITED`) to your token checking function.
3. The AST is evaluated with short-circuiting, so your checker is only called for tokens that can still change the result.

## Example (CommonJS)

```javascript
const { parse } = require('logical-expression-parser');

const REQUIREMENTS = 'REGISTED&(SPECIAL|INVITED)';
const LIST_A = ['REGISTED', 'INVITED'];
const LIST_B = ['SPECIAL', 'EXPERT'];

const RESULT_A = parse(REQUIREMENTS, token => LIST_A.includes(token));
const RESULT_B = parse(REQUIREMENTS, token => LIST_B.includes(token));

// RESULT_A: true
// RESULT_B: false
```

## Example (ESM)

```javascript
import { parse } from 'logical-expression-parser';
// same as above
```

## AST API

```javascript
import { parseAst, evaluate } from 'logical-expression-parser';

const ast = parseAst('REGISTED&!(BANNED)');
// {
//   type: 'and',
//   left: { type: 'literal', value: 'REGISTED' },
//   right: { type: 'not', operand: { type: 'literal', value: 'BANNED' } }
// }

const allowed = evaluate(ast, token => userPermissions.includes(token));
```

## Async Evaluation

For permission checks requiring database or network calls, use `parseAsync` or `evaluateAsync`:

```javascript
import { parseAsync } from 'logical-expression-parser';

const allowed = await parseAsync('ADMIN | (SPECIAL & !BANNED)', async token => {
  return await checkUserPermission(userId, token);
});
```

Like the synchronous API, evaluation short-circuits so subsequent async checks are skipped once the outcome is determined.

## Types

```typescript
export type TokenChecker = (token: string) => boolean;
export type AsyncTokenChecker = (token: string) => boolean | Promise<boolean>;

export type LiteralNode = { readonly type: 'literal'; readonly value: string };
export type NotNode = { readonly type: 'not'; readonly operand: AstNode };
export type BinaryNode = {
  readonly type: 'and' | 'or';
  readonly left: AstNode;
  readonly right: AstNode;
};
export type AstNode = LiteralNode | NotNode | BinaryNode;
```

## Errors

Malformed expressions — empty inputs, `A&`, `&A`, `()`, unbalanced parentheses, stray tokens — throw `LEPSyntaxError`, a `SyntaxError` subclass carrying the character offset. Invalid argument types (e.g. non-string expression or non-function checker) throw `TypeError`.

```javascript
import { parse, LEPSyntaxError } from 'logical-expression-parser';

try {
  parse('A&(B|C', checker);
} catch (error) {
  if (error instanceof LEPSyntaxError) {
    // error.offset === 6
  }
}
```

## Development

Requires Node >= 18.

```sh
npm install
npm test   # builds dist/, compiles tests, runs node --test with a c8 coverage report, smoke-checks both dist builds
```

Sources live in `src/`, tests in `test/`; `npm run build` emits `dist/cjs` and `dist/esm`.

## Releasing

Releases publish to npm from GitHub Actions when a `v`-tag is pushed:

1. Bump `version` in `package.json` and commit.
2. `git tag v<version> && git push origin v<version>` — the tag must match `version` exactly (enforced by the workflow).
3. The workflow builds, runs the full test suite, and publishes with provenance using npm Trusted Publishing (OIDC keyless publishing; configure your repository once under Package Settings → Trusted Publishing on npmjs.com).
