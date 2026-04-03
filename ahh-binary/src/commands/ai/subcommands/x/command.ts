import type { AhhCommand } from "../../../../types/command";
import { generateCommand } from "./main";

interface XArgs {
  prompt: string[];
}

export const aiXCommand: AhhCommand<XArgs> = {
  command: "x <prompt..>",
  describe: "Generate and run a shell command from natural language.",
  meta: {
    description:
      "Translates a natural-language prompt into a shell command using an LLM, shows you the generated command, and optionally executes it.",
    examples: [
      { command: "ahh ai x list all docker containers", description: "Generate a docker ps command" },
      { command: "ahh ai x find files modified today", description: "Generate a find command" },
    ],
    category: "ai",
  },
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
