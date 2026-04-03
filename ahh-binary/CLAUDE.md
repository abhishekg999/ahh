# ahh CLI

A Bun/TypeScript developer toolkit. Compiled to a single binary via `bun build --compile`.

## Quick reference

```sh
bun run dev          # Run locally (loads .bun.env.local)
bun run check        # TypeScript type check (tsc --noEmit)
bun run compile:prod # Build standalone binary → ./dist/bin/ahh
```

## Project layout

```
main.ts                          # Entry point — yargs CLI setup
src/
├── commands/                    # Each command: command.ts (yargs) + main.ts (logic)
│   ├── index.ts                 # Barrel — registers all commands
│   ├── shell/                   # ahh $ (alias) — shell utilities
│   │   ├── spawn.ts             # Shared typed spawn helper (spawnShell, collectOutput)
│   │   └── subcommands/         # repeat, retry, each, race, watch
│   ├── tunnel/                  # Cloudflare tunnel system
│   │   ├── main.ts              # Core: quick tunnel vs named (wildcard) tunnel
│   │   ├── daemon.ts            # Background daemon lifecycle (PID file)
│   │   ├── router.ts            # Subdomain → port routing proxy
│   │   ├── proxy.ts             # Per-client request logging proxy
│   │   ├── cloudflared-config.ts # Generate cloudflared YAML
│   │   └── words.ts             # Random subdomain generation
│   ├── serve/                   # Static file server + tunnel
│   └── ...                      # ai, clip, k8s, port, qr, rand, etc.
├── db/
│   ├── schema.ts                # Drizzle schema (bun:sqlite)
│   └── main.ts                  # DB singleton, stale cleanup
├── externals/
│   ├── external-binary.ts       # Abstract base for managed binaries
│   ├── system-binary.ts         # Wraps system commands (Bun.which + Bun.spawn)
│   ├── cloudflared.ts           # Auto-downloads cloudflared to ~/.ahh/bin/
│   └── kind.ts                  # Auto-downloads kind to ~/.ahh/bin/
├── config/
│   ├── types.ts                 # Zod schema for ~/.ahh/ahh.config.json
│   └── main.ts                  # load/save/update config
├── utils/                       # fs, path, os, semver, text (colors/spinner)
├── types/command.ts             # AhhCommand<U> — type contract for all commands
└── constants/main.ts            # VERSION, URLs
```

## Command pattern

Every command lives in `src/commands/<name>/`:

- `command.ts` — Yargs definition (`AhhCommand<Args>`), wiring only
- `main.ts` — Business logic, no yargs dependency

Subcommands go in `subcommands/<name>/` with the same split. Register via `yargs.command()` in the parent builder.

## Key conventions

- **Type safety**: Strict TypeScript. Never use `!` assertions or `as` casts — fix the actual types.
- **External binaries**: Use `ExternalBinary` subclasses in `src/externals/`. System commands use `SystemBinary`, downloadable tools extend the base with install logic. Never shell out to a binary without going through an external.
- **Config**: Zod-validated JSON at `~/.ahh/ahh.config.json`. Use `getConfig()` / `updateConfig()`.
- **Database**: `bun:sqlite` + drizzle-orm at `~/.ahh/ahh.db`. Schema auto-created via `CREATE TABLE IF NOT EXISTS` in `getDb()`. No migration files.
- **Spawn**: For shell subcommands, use `spawnShell()` and `collectOutput()` from `src/commands/shell/spawn.ts` — these return properly typed `Bun.ReadableSubprocess`.
- **CLI output**: Minimal. No heavy tables or boxes. Use `color()` and `startSpinner()` from `src/utils/text.ts`.

## Tunnel architecture

Named tunnels use wildcard DNS (`*.tunnel.ahh.bet`) with a shared daemon:

1. Each `ahh tunnel -p <port>` registers a subdomain → port mapping in SQLite
2. A background daemon (router proxy + cloudflared) handles all tunnels
3. Router reads `Host` header, looks up subdomain, forwards to correct port
4. Cleanup: process exit deletes mapping; stale PIDs pruned on next startup or 502
