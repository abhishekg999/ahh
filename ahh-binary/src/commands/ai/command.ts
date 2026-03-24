import type { AhhCommand } from "../../types/command";
import { configureLLM, generateCommand } from "./main";

interface AiArgs {
  prompt?: string[];
  configure?: boolean;
}

export const aiCommand: AhhCommand<AiArgs> = {
  command: "ai [prompt..]",
  describe: "Generate a shell command from natural language.",
  builder: (yargs) =>
    yargs
      .positional("prompt", {
        type: "string",
        array: true,
        description: "What you want to do",
      })
      .option("configure", {
        alias: "c",
        type: "boolean",
        description: "Configure LLM provider, model, and API keys",
      }),
  handler: async (argv) => {
    if (argv.configure) {
      await configureLLM();
      return;
    }

    if (!argv.prompt || argv.prompt.length === 0) {
      console.error("Provide a prompt. Usage: ahh ai <what you want to do>");
      process.exit(1);
    }

    const prompt = argv.prompt.join(" ");
    await generateCommand(prompt);
  },
};
