import type { AhhCommand } from "../../../../types/command";
import { raceCommand, splitOnDelimiter } from "./main";

interface RaceArgs {
  _: (string | number)[];
}

export const shellRaceCommand: AhhCommand<RaceArgs> = {
  command: "race",
  describe:
    "Run commands in parallel, keep the first to succeed. Separate with ---",
  meta: {
    description:
      "Runs multiple commands in parallel and keeps only the first one to exit successfully. Remaining processes are killed. Commands are separated by `---`.",
    examples: [
      {
        command: "ahh $ race curl -s mirror1.example.com --- curl -s mirror2.example.com",
        description: "Race two mirrors and keep the fastest response",
      },
    ],
    category: "shell",
  },
  builder: (yargs) => yargs.strict(false),
  handler: async (argv) => {
    const rest = argv._.slice(argv._.indexOf("race") + 1);
    const commands = splitOnDelimiter(rest);
    await raceCommand(commands);
  },
};
