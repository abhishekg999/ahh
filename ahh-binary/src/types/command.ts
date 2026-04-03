import type { CommandModule } from "yargs";

/**
 * Categories for grouping commands in generated documentation.
 */
export type CommandCategory =
  | "shell"
  | "networking"
  | "generation"
  | "ai"
  | "kubernetes"
  | "utility"
  | "config";

/**
 * A single usage example shown in docs.
 */
export interface CommandExample {
  /** The full command as you'd type it, e.g. "ahh rand 32 --hex" */
  command: string;
  /** What this example demonstrates */
  description: string;
}

/**
 * Self-documentation metadata — every command must provide this.
 * Used by the doc-gen script to produce the website's /docs pages.
 */
export interface CommandMeta {
  /** Multi-sentence description for docs (distinct from the one-liner `describe`). */
  description: string;
  /** At least one usage example. */
  examples: [CommandExample, ...CommandExample[]];
  /** Category for grouping in the docs sidebar. */
  category: CommandCategory;
  /** If true, this command is excluded from generated docs (e.g. internal daemons). */
  hidden?: boolean;
}

/**
 * Type contract for every ahh CLI command.
 * U = this command's parsed argv shape (inferred from builder).
 * Type safety is enforced at the definition site — each command.ts file.
 */
export type AhhCommand<U = {}> = Required<
  Pick<CommandModule<{}, U>, "command" | "describe" | "handler">
> &
  Pick<CommandModule<{}, U>, "builder" | "aliases" | "deprecated"> & {
    /** Self-documentation metadata. */
    meta: CommandMeta;
    /** Subcommands registered in this command's builder (for doc-gen traversal). */
    subcommands?: DocTraversable[];
  };

/** Minimal shape for doc-gen traversal — avoids handler contravariance issues. */
export interface DocTraversable {
  command: string | readonly string[];
  describe?: string | false;
  meta?: CommandMeta;
  subcommands?: DocTraversable[];
  builder?: unknown;
  aliases?: string | readonly string[];
}

/** Type-erased command for heterogeneous arrays passed to yargs.command(). */
export type AnyCommand = CommandModule<{}, unknown> & {
  meta?: CommandMeta;
  subcommands?: DocTraversable[];
};
