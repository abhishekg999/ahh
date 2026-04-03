import type { AhhCommand } from "../../../../types/command";
import { raceCommand, splitOnDelimiter } from "./main";

interface RaceArgs {
  _: (string | number)[];
}

export const shellRaceCommand: AhhCommand<RaceArgs> = {
  command: "race",
  describe:
    "Run commands in parallel, keep the first to succeed. Separate with ---",
  builder: (yargs) => yargs.strict(false),
  handler: async (argv) => {
    const rest = argv._.slice(argv._.indexOf("race") + 1);
    const commands = splitOnDelimiter(rest);
    await raceCommand(commands);
  },
};
