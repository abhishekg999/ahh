import type { AhhCommand } from "../../../../types/command";
import { retryCommand } from "./main";

interface RetryArgs {
  count: number;
  command: string[];
}

export const shellRetryCommand: AhhCommand<RetryArgs> = {
  command: "retry <count> <command..>",
  describe: "Retry a command up to N times until it succeeds.",
  meta: {
    description:
      "Runs the given command and retries it up to N times if it exits with a non-zero code. Stops as soon as the command succeeds.",
    examples: [
      { command: "ahh $ retry 3 curl -sf localhost:3000/health", description: "Retry a health check up to 3 times" },
      { command: "ahh $ retry 5 make build", description: "Retry a flaky build up to 5 times" },
    ],
    category: "shell",
  },
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
