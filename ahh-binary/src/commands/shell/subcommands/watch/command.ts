import type { AhhCommand } from "../../../../types/command";
import { watchCommand } from "./main";

interface WatchArgs {
  interval: number;
  command: string[];
}

export const shellWatchCommand: AhhCommand<WatchArgs> = {
  command: "watch <interval> <command..>",
  describe: "Re-run a command every N seconds.",
  meta: {
    description:
      "Repeatedly runs a command at a fixed interval, showing the output each time. Similar to the Unix `watch` utility.",
    examples: [
      { command: "ahh $ watch 5 kubectl get pods", description: "Check pod status every 5 seconds" },
      { command: "ahh $ watch 2 date", description: "Print the date every 2 seconds" },
    ],
    category: "shell",
  },
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
