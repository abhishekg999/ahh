import type { CommandModule } from "yargs";

/**
 * Type contract for every ahh CLI command.
 * U = this command's parsed argv shape (inferred from builder).
 * Type safety is enforced at the definition site — each command.ts file.
 */
export type AhhCommand<U = {}> = Required<
  Pick<CommandModule<{}, U>, "command" | "describe" | "handler">
> &
  Pick<CommandModule<{}, U>, "builder" | "aliases" | "deprecated">;

/** Type-erased command for heterogeneous arrays passed to yargs.command(). */
export type AnyCommand = CommandModule<{}, unknown>;
