# ts

Super strict, opinionated TypeScript workspace. Bun runtime. Zero tolerance.

## Quick Start

```bash
bun install
bun run dev
```

## Scripts

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `bun run dev`      | Start with watch mode              |
| `bun run check`    | TypeScript type checking           |
| `bun run lint`     | oxlint strict (zero warnings)      |
| `bun run lint:fix` | Auto-fix lint issues               |
| `bun run format`   | Format with oxfmt                  |
| `bun run format:check` | Check formatting              |

All three (`check`, `lint`, `format:check`) must pass before every commit.

## Project Structure

```
src/
├── index.ts          Entry point. Calls main(). Nothing else.
├── types/
│   └── index.ts      Type definitions. No runtime code.
└── lib/
    └── index.ts      Shared constants and utilities. Keep minimal.
```

### Where to put things

| I need to...               | Put it in...                                     |
| -------------------------- | ------------------------------------------------ |
| Define a type or interface | `src/types/<name>.ts` + re-export from index     |
| Write a shared utility     | `src/lib/<name>.ts` + re-export from index       |
| Add a new domain area      | New `src/<domain>/` dir with its own `index.ts`  |
| Add a constant             | `src/lib/constants.ts`                           |

### File rules

- One concept per file. Split at ~150 lines.
- Every directory has an `index.ts` barrel. Re-exports only, never logic.
- Files: `kebab-case.ts`. Always.
- Tests: `*.test.ts`, colocated next to source.

## Agent Files

`CLAUDE.md` is the single source of truth for development guidelines. Symlinked to:

| File                               | For            |
| ---------------------------------- | -------------- |
| `CLAUDE.md`                        | Claude Code    |
| `AGENTS.md`                        | Generic agents |
| `.cursorrules`                     | Cursor IDE     |
| `.github/copilot-instructions.md`  | GitHub Copilot |

Edit `CLAUDE.md` only. The symlinks follow.

## The Rules (short version)

Read `CLAUDE.md` for full rules.

- **Banned:** `any`, `as` (except `as const`), `!`, `enum`, `class`, `default export`, `var`, `++/--`, `forEach`, `bitwise ops`
- **Files:** `kebab-case.ts`
- **Types:** `PascalCase`, no `I`/`T` prefix
- **Functions:** `camelCase`, explicit return types on exports, max 3 params
- **Constants:** `SCREAMING_SNAKE_CASE`
- **Booleans:** `is`/`has`/`should`/`can` prefix
- **Imports:** `import type` for types, sorted by oxfmt, no circular imports
