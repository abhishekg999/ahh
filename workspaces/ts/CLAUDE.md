# Development Rules

Extremely strict, opinionated TypeScript. These rules are non-negotiable.

## Tech Stack

- **Runtime:** Bun
- **Language:** TypeScript (strictest tsconfig)
- **Linting:** oxlint (all categories denied, zero warnings)
- **Formatting:** oxfmt (run before every commit)

## Commands

```bash
bun run check         # tsc --noEmit. Zero errors.
bun run lint          # oxlint strict. Zero warnings.
bun run format        # oxfmt. Run before every commit.
bun run format:check  # CI check. Must pass.
```

All three must pass before any commit. Order: `format` then `lint` then `check`.

---

## File Structure

```
src/
├── index.ts        Entry point. Calls main(). Nothing else.
├── types/          Type definitions only. NO runtime code.
│   └── index.ts    Barrel re-exports only.
└── lib/            Shared constants and utilities. Keep minimal.
    └── index.ts    Barrel re-exports only.
```

### Placement rules

- **New type or interface?** → `src/types/<name>.ts`, re-export from `src/types/index.ts`
- **Shared utility?** → `src/lib/<name>.ts`, re-export from `src/lib/index.ts`
- **New domain area?** → Create `src/<domain>/` with its own `index.ts` barrel

### File rules

- One concept per file. Split at ~150 lines.
- Every directory MUST have an `index.ts` that only contains re-exports.
- `index.ts` files NEVER contain business logic, type definitions, or constants.

---

## Naming Conventions

### Files and Directories

| Thing      | Convention           | Example              |
| ---------- | -------------------- | -------------------- |
| Source file| `kebab-case.ts`      | `message-parser.ts`  |
| Test file  | `kebab-case.test.ts` | `message-parser.test.ts` |
| Directory  | `kebab-case/`        | `data-store/`        |
| Barrel     | `index.ts`           | Re-exports only.     |

Never `camelCase.ts`, `PascalCase.ts`, or `snake_case.ts`.

### Types and Interfaces

| Convention   | Example                                |
| ------------ | -------------------------------------- |
| `PascalCase` | `UserMessage`, `HttpResponse`, `Config`|
| No prefix    | `User`, NOT ~~`IUser`~~ or ~~`TUser`~~ |
| Prefer `type`| Use `interface` only when you need `extends` or declaration merging |

### Functions

| Convention           | Example                          |
| -------------------- | -------------------------------- |
| `camelCase`          | `createClient`, `parseResponse`  |
| Explicit return type | Required on ALL exported functions |
| Max 3 parameters     | Use an options object for more   |
| No `Async` suffix    | `fetchUser`, NOT ~~`fetchUserAsync`~~ |
| Verb-first           | `create`, `parse`, `build`, `handle`, `validate` |

### Variables

| Convention         | Example                            |
| ------------------ | ---------------------------------- |
| `camelCase`        | `messageCount`, `userInput`        |
| Boolean prefix     | `isValid`, `hasPermission`, `shouldRetry`, `canStream` |
| Array: plural noun | `messages`, `items`, `results`     |
| No abbreviations   | `message`, NOT ~~`msg`~~           |

### Constants

| Convention             | Example                          |
| ---------------------- | -------------------------------- |
| `SCREAMING_SNAKE_CASE` | `MAX_RETRIES`, `API_TIMEOUT_MS`  |
| Only true constants    | Compile-time known, never reassigned |
| Derived values         | Use `camelCase` instead          |

---

## Banned Patterns

Hard errors. Never use.

| Banned                           | Use Instead                                  |
| -------------------------------- | -------------------------------------------- |
| `any`                            | `unknown` + type narrowing                   |
| `as Type` assertion              | Type guards, `satisfies`, or fix the type    |
| `!` non-null assertion           | Null check, optional chaining, or `?? throw` |
| `enum`                           | `as const` object + `keyof typeof`           |
| `class`                          | Functions, closures, plain objects            |
| `default export`                 | Named exports only                           |
| `var`                            | `const` (prefer) or `let`                    |
| `== / !=`                        | `=== / !==` always                           |
| `++ / --`                        | `+= 1` / `-= 1`                             |
| Nested ternary                   | `if`/`else` or early return                  |
| `else` after `return`            | Early return pattern                         |
| `@ts-ignore`                     | Fix the type error                           |
| `@ts-expect-error`               | Only in test files, with explanation         |
| `eval()` / `new Function()`      | Never                                        |
| Implicit return type (exported)  | Annotate explicitly                          |
| `forEach`                        | `for...of` loop                              |
| String concat with `+`          | Template literals                            |
| `arguments` object               | Rest parameters (`...args`)                  |
| `Object.assign`                  | Spread (`{ ...obj }`)                        |
| Bitwise operators                | Explicit math or boolean logic               |
| Barrel files with logic          | `index.ts` is re-exports only                |

---

## Code Patterns

### Early returns over nesting

```typescript
// CORRECT
function processInput(input: unknown): string {
  if (typeof input !== "string") {
    throw new TypeError("Expected string input");
  }
  if (input.length === 0) {
    return "";
  }
  return input.trim();
}

// WRONG
function processInput(input: unknown): string {
  if (typeof input === "string") {
    if (input.length > 0) {
      return input.trim();
    } else {
      return "";
    }
  } else {
    throw new TypeError("Expected string input");
  }
}
```

### Discriminated unions for results

```typescript
type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

### Constant maps with `as const satisfies`

```typescript
const STATUS = {
  active: "active",
  inactive: "inactive",
  pending: "pending",
} as const satisfies Record<string, string>;

type StatusKey = keyof typeof STATUS;
```

### Options objects for complex functions

```typescript
type FetchOptions = {
  readonly url: string;
  readonly timeout: number;
  readonly retries?: number;
};

function fetchData(options: FetchOptions): Promise<unknown> {
  // ...
}
```

---

## Import Rules

### Order (enforced by oxfmt `sortImports`)

1. Node/Bun built-ins (with `node:` protocol)
2. External packages
3. Internal relative imports
4. Type-only imports last within each group

### Conventions

```typescript
import { readFile } from "node:fs/promises";

import { z } from "zod";

import { parseInput } from "./lib/index.ts";

import type { Config } from "./types/index.ts";
```

- Always use `import type` for type-only imports. Enforced by `verbatimModuleSyntax`.
- Always include `.ts` extension for relative imports.
- Never create circular imports. The dependency graph is a DAG.

---

## Error Handling

- **Validate at boundaries:** User input, API responses, env vars, file I/O.
- **Trust internal code:** No defensive null checks between your own functions.
- **Wrap errors with context:** What failed, what inputs were provided.
- **Never catch and ignore.** If you catch, log or re-throw with context.

---

## Git Conventions

- **Message format:** `<type>: <description>` (lowercase, imperative)
  - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- One logical change per commit.
- `bun run format && bun run lint && bun run check` before committing.
- Never commit: `.env`, `node_modules/`, `dist/`, `*.log`

---

## Strictness Checklist

Before submitting any code:

- [ ] No `any` anywhere
- [ ] No `as` assertions (except `as const`)
- [ ] No `!` non-null assertions
- [ ] No default exports
- [ ] No classes or enums
- [ ] All exported functions have explicit return types
- [ ] All files are `kebab-case.ts`
- [ ] All types are `PascalCase` without prefix
- [ ] All imports use `import type` where applicable
- [ ] All relative imports include `.ts` extension
- [ ] Max 3 parameters per function
- [ ] No nested ternaries, no `else` after `return`
- [ ] `bun run check` passes
- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
