import type { AhhCommand } from "../../../../types/command";
import { repeatCommand } from "./main";

interface RepeatArgs {
  count: number;
  command: string[];
}

export const shellRepeatCommand: AhhCommand<RepeatArgs> = {
  command: "repeat <count> <command..>",
  describe: "Run a command N times in parallel.",
  builder: (yargs) =>
    yargs
      .positional("count", {
        type: "number",
        description: "Number of times to run",
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
    await repeatCommand(argv.count, argv.command);
  },
};
