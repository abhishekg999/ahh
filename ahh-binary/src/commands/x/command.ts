import type { AhhCommand } from "../../types/command";
import { generateCommand } from "../ai/subcommands/x/main";

interface XArgs {
  prompt: string[];
}

export const xCommand: AhhCommand<XArgs> = {
  command: "x <prompt..>",
  describe: "AI shell command (shortcut for 'ai x').",
  builder: (yargs) =>
    yargs.positional("prompt", {
      type: "string",
      array: true,
      description: "What you want to do",
      demandOption: true,
    }),
  handler: async (argv) => {
    await generateCommand(argv.prompt.join(" "));
  },
};
