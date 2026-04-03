import type { AhhCommand } from "../../../../types/command";
import { repeatCommand } from "./main";

interface RepeatArgs {
  count: number;
  command: string[];
}

export const shellRepeatCommand: AhhCommand<RepeatArgs> = {
  command: "repeat <count> <command..>",
  describe: "Run a command N times in parallel.",
  meta: {
    description:
      "Spawns the given command N times in parallel and streams all output. Useful for load testing or running concurrent jobs.",
    examples: [
      { command: "ahh $ repeat 5 curl -s localhost:3000", description: "Hit an endpoint 5 times in parallel" },
      { command: "ahh $ repeat 3 echo hello", description: "Run echo 3 times concurrently" },
    ],
    category: "shell",
  },
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
