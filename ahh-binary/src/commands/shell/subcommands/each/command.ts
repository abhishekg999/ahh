import type { AhhCommand } from "../../../../types/command";
import { eachCommand } from "./main";

interface EachArgs {
  command: string[];
}

export const shellEachCommand: AhhCommand<EachArgs> = {
  command: "each <command..>",
  describe: "Run a command for each line of stdin (parallel).",
  builder: (yargs) =>
    yargs
      .positional("command", {
        type: "string",
        array: true,
        description: "Command to run (line appended as last arg)",
        demandOption: true,
      })
      .strict(false),
  handler: async (argv) => {
    await eachCommand(argv.command);
  },
};
