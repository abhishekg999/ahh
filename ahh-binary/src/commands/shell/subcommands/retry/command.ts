import type { AhhCommand } from "../../../../types/command";
import { retryCommand } from "./main";

interface RetryArgs {
  count: number;
  command: string[];
}

export const shellRetryCommand: AhhCommand<RetryArgs> = {
  command: "retry <count> <command..>",
  describe: "Retry a command up to N times until it succeeds.",
  builder: (yargs) =>
    yargs
      .positional("count", {
        type: "number",
        description: "Max number of attempts",
        demandOption: true,
      })
      .positional("command", {
        type: "string",
        array: true,
        description: "Command to run",
        demandOption: true,
      })
      .strict(false),
  handler: async (argv) => {
    await retryCommand(argv.count, argv.command);
  },
};
