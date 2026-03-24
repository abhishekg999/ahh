import type { AhhCommand } from "../../../../types/command";
import { generateCommand } from "./main";

interface XArgs {
  prompt: string[];
}

export const aiXCommand: AhhCommand<XArgs> = {
  command: "x <prompt..>",
  describe: "Generate and run a shell command from natural language.",
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
