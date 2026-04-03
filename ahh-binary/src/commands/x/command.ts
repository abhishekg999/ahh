import type { AhhCommand } from "../../types/command";
import { generateCommand } from "../ai/subcommands/x/main";

interface XArgs {
  prompt: string[];
}

export const xCommand: AhhCommand<XArgs> = {
  command: "x <prompt..>",
  describe: "AI shell command (shortcut for 'ai x').",
  meta: {
    description:
      "Shortcut for `ahh ai x`. Generates a shell command from a natural-language prompt using an LLM, previews it, and optionally runs it.",
    examples: [
      { command: "ahh x find all large files over 100mb", description: "Generate a command to find large files" },
      { command: "ahh x compress this directory as tar.gz", description: "Generate a tar compression command" },
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
