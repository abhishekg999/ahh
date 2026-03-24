# ahh

A CLI toolkit for CTF workflows — tunneling, file serving, webhooks, port management, and more.

## Install

```bash
curl -fsSL https://cli.ahh.bet/install.sh | bash
```

## Commands

| Command                 | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `ahh tunnel -p <port>`  | Tunnel a local port via Cloudflare             |
| `ahh serve [-p <port>]` | Serve the current directory over HTTP + tunnel |
| `ahh webhook`           | Start a webhook server with live dashboard     |
| `ahh workspace <name>`  | Initialize a CTF workspace template            |
| `ahh port <port\|list>` | Inspect or kill processes on ports             |
| `ahh clip`              | Copy stdin to clipboard                        |
| `ahh qr`                | Generate a QR code from stdin                  |
| `ahh share-discord`     | Send stdin to a Discord webhook                |
| `ahh update`            | Update the CLI to the latest version           |

## Development

```bash
bun install
bun run dev           # run with dev env
bun run check         # typecheck
bun run compile:prod  # build binary
```

## Adding a New Command

Every command follows the same scaffold: a `main.ts` for business logic and a `command.ts` for yargs wiring.

### 1. Create the command folder

```
src/commands/my-command/
  main.ts       # business logic (pure functions, no yargs)
  command.ts    # yargs definition
```

### 2. Define business logic in `main.ts`

```typescript
// src/commands/my-command/main.ts
export async function doThing(input: string) {
  // ...
}
```

### 3. Define the command in `command.ts`

Import `AhhCommand` and wire up yargs config + handler:

```typescript
// src/commands/my-command/command.ts
import type { AhhCommand } from "../../types/command";
import { doThing } from "./main";

interface MyCommandArgs {
  name: string;
  verbose?: boolean;
}

export const myCommand: AhhCommand<MyCommandArgs> = {
  command: "my-command <name>",
  describe: "Does the thing.",
  builder: (yargs) =>
    yargs
      .positional("name", {
        type: "string",
        description: "Name of the thing",
        demandOption: true,
      })
      .option("verbose", {
        alias: "v",
        type: "boolean",
        description: "Enable verbose output",
      }),
  handler: async (argv) => {
    await doThing(argv.name);
  },
};
```

For simple commands with no args, omit `builder` and the generic:

```typescript
export const simpleCommand: AhhCommand = {
  command: "simple",
  describe: "Does a simple thing.",
  handler: async () => {
    // ...
  },
};
```

### 4. Register in the barrel

Add one import + one array entry to `src/commands/index.ts`:

```typescript
import { myCommand } from "./my-command/command";

export const commands: AhhCommand<any>[] = [
  // ...existing commands
  myCommand,
];
```

That's it. The command is now available in the CLI.
