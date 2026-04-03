import type { AhhCommand } from "../../types/command";
import { shellRaceCommand } from "./subcommands/race/command";
import { shellRepeatCommand } from "./subcommands/repeat/command";
import { shellRetryCommand } from "./subcommands/retry/command";
import { shellWatchCommand } from "./subcommands/watch/command";

export const shellCommand: AhhCommand = {
  command: "shell",
  aliases: ["$"],
  describe: "Shell utilities.",
  meta: {
    description:
      "A collection of shell utilities for running commands with strategies like parallel repetition, automatic retries, racing, and interval-based watching.",
    examples: [
      { command: "ahh $ repeat 3 echo hello", description: "Run a command 3 times in parallel" },
      { command: "ahh $ retry 5 make build", description: "Retry a flaky command" },
    ],
    category: "shell",
  },
  subcommands: [shellRepeatCommand, shellRetryCommand, shellRaceCommand, shellWatchCommand],
  builder: (yargs) =>
    yargs
      .command(shellRepeatCommand)
      .command(shellRetryCommand)
      .command(shellRaceCommand)
      .command(shellWatchCommand)
      .demandCommand(1, "Specify a subcommand: repeat, retry, race, watch")
      .strict(false),
  handler: async () => {},
};
