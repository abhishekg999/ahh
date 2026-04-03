import type { AhhCommand } from "../../types/command";
import { shellEachCommand } from "./subcommands/each/command";
import { shellRaceCommand } from "./subcommands/race/command";
import { shellRepeatCommand } from "./subcommands/repeat/command";
import { shellRetryCommand } from "./subcommands/retry/command";
import { shellWatchCommand } from "./subcommands/watch/command";

export const shellCommand: AhhCommand = {
  command: "shell",
  aliases: ["$"],
  describe: "Shell utilities.",
  builder: (yargs) =>
    yargs
      .command(shellRepeatCommand)
      .command(shellRetryCommand)
      .command(shellEachCommand)
      .command(shellRaceCommand)
      .command(shellWatchCommand)
      .demandCommand(
        1,
        "Specify a subcommand: repeat, retry, each, race, watch",
      )
      .strict(false),
  handler: async () => {},
};
