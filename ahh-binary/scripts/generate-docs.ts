/**
 * Doc-gen script — introspects all CLI commands and outputs structured JSON.
 *
 * Usage:
 *   bun run scripts/generate-docs.ts            # prints to stdout
 *   bun run scripts/generate-docs.ts -o out.json # writes to file
 */

import yargs from "yargs";
import { commands } from "../src/commands/index";
import { VERSION } from "../src/constants/main";
import type { AnyCommand, DocTraversable } from "../src/types/command";

// ── Types for the output JSON ──────────────────────────────────────

interface DocOption {
  name: string;
  alias?: string;
  type: string;
  description?: string;
  default?: unknown;
  required: boolean;
  choices?: unknown[];
}

interface DocPositional {
  name: string;
  type: string;
  description?: string;
  default?: unknown;
  required: boolean;
  array?: boolean;
  choices?: unknown[];
}

interface DocCommand {
  name: string;
  command: string;
  describe: string;
  description: string;
  aliases: string[];
  category: string;
  examples: Array<{ command: string; description: string }>;
  positionals: DocPositional[];
  options: DocOption[];
  subcommands: DocCommand[];
}

interface DocsOutput {
  version: string;
  generatedAt: string;
  commands: DocCommand[];
}

// ── Yargs introspection ────────────────────────────────────────────

/** Built-in yargs options we never want in docs. */
const IGNORED_OPTIONS = new Set(["help", "version", "_", "$0"]);

function extractCommandInfo(cmd: DocTraversable): DocCommand | null {
  const meta = cmd.meta;

  // Skip hidden commands
  if (meta?.hidden) return null;
  if (cmd.describe === false) return null;

  // Parse command name from the yargs command string
  const commandStr = typeof cmd.command === "string" ? cmd.command : String(cmd.command);
  const name = commandStr.split(/\s/)[0];

  // Build a temporary yargs instance to introspect builder output
  const positionals: DocPositional[] = [];
  const options: DocOption[] = [];

  // Extract positionals from the command string pattern
  const positionalPattern = /[<\[](\w+?)(\.\.)?[>\]]/g;
  let match;
  while ((match = positionalPattern.exec(commandStr)) !== null) {
    positionals.push({
      name: match[1],
      type: "string",
      required: commandStr[match.index] === "<",
      array: match[2] === "..",
    });
  }

  // Call the builder, intercepting .option() and .positional() calls to capture metadata
  if (typeof cmd.builder === "function") {
    try {
      const fakeYargs: any = yargs([]);

      // Intercept .positional() to enrich positionals parsed from the command string
      const origPositional = fakeYargs.positional.bind(fakeYargs);
      fakeYargs.positional = (posName: string, opts: Record<string, unknown>) => {
        const existing = positionals.find((p) => p.name === posName);
        if (existing) {
          existing.type = (opts.type as string) ?? existing.type;
          existing.description = opts.description as string | undefined;
          existing.default = opts.default;
          existing.required = existing.required && opts.default === undefined;
          existing.choices = opts.choices as unknown[] | undefined;
          if (opts.array) existing.array = true;
        }
        return origPositional(posName, opts);
      };

      // Track positional names so we can filter them from .option() calls
      const positionalNames = new Set(positionals.map((p) => p.name));

      // Intercept .option() to capture options with full metadata
      const origOption = fakeYargs.option.bind(fakeYargs);
      fakeYargs.option = (optName: string, opts: Record<string, unknown>) => {
        if (!IGNORED_OPTIONS.has(optName) && !positionalNames.has(optName)) {
          options.push({
            name: optName,
            alias: typeof opts.alias === "string" ? opts.alias : undefined,
            type: (opts.type as string) ?? "string",
            description: opts.description as string | undefined,
            default: opts.default,
            required: opts.demandOption === true,
            choices: Array.isArray(opts.choices) && opts.choices.length > 0 ? opts.choices : undefined,
          });
        }
        return origOption(optName, opts);
      };

      (cmd.builder as Function)(fakeYargs);
    } catch {
      // Builder may have side effects; best-effort extraction
    }
  }

  // Recurse into subcommands
  const subcommands: DocCommand[] = [];
  if (cmd.subcommands) {
    for (const sub of cmd.subcommands) {
      const subDoc = extractCommandInfo(sub);
      if (subDoc) subcommands.push(subDoc);
    }
  }

  return {
    name,
    command: commandStr,
    describe: typeof cmd.describe === "string" ? cmd.describe : "",
    description: meta?.description ?? "",
    aliases: Array.isArray(cmd.aliases) ? cmd.aliases.map(String) : [],
    category: meta?.category ?? "utility",
    examples: meta?.examples ?? [],
    positionals: positionals.filter((p) => p.name !== "_"),
    options,
    subcommands,
  };
}

// ── Main ───────────────────────────────────────────────────────────

const docs: DocsOutput = {
  version: VERSION,
  generatedAt: new Date().toISOString(),
  commands: [],
};

for (const cmd of commands) {
  const info = extractCommandInfo(cmd as DocTraversable);
  if (info) docs.commands.push(info);
}

// Sort by category then name
docs.commands.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

const json = JSON.stringify(docs, null, 2);

const outFlag = process.argv.indexOf("-o");
if (outFlag !== -1 && process.argv[outFlag + 1]) {
  await Bun.write(process.argv[outFlag + 1], json);
  console.log(`Wrote docs to ${process.argv[outFlag + 1]}`);
} else {
  console.log(json);
}
