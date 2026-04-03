import type { AhhCommand } from "../../../../types/command";
import { watchCommand } from "./main";

interface WatchArgs {
  interval: number;
  command: string[];
}

export const shellWatchCommand: AhhCommand<WatchArgs> = {
  command: "watch <interval> <command..>",
  describe: "Re-run a command every N seconds.",
  builder: (yargs) =>
    yargs
      .positional("interval", {
        type: "number",
        description: "Seconds between runs",
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
    await watchCommand(argv.interval, argv.command);
  },
};
