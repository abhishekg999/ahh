import type { AhhCommand } from "../../types/command";
import { aiConfigureCommand } from "./subcommands/configure/command";
import { aiModelsCommand } from "./subcommands/models/command";
import { aiXCommand } from "./subcommands/x/command";

export const aiCommand: AhhCommand = {
  command: "ai",
  describe: "AI-powered tools.",
  meta: {
    description:
      "AI-powered developer tools. Generate shell commands from natural language, browse available models, or configure your LLM provider.",
    examples: [
      { command: "ahh ai x list all running processes", description: "Generate a shell command with AI" },
      { command: "ahh ai models", description: "Browse available LLM models" },
      { command: "ahh ai configure", description: "Set up LLM provider" },
    ],
    category: "ai",
  },
  subcommands: [aiXCommand, aiModelsCommand, aiConfigureCommand],
  builder: (yargs) =>
    yargs
      .command(aiXCommand)
      .command(aiModelsCommand)
      .command(aiConfigureCommand)
      .demandCommand(1, "Specify a subcommand: x, models, configure"),
  handler: () => {},
};
