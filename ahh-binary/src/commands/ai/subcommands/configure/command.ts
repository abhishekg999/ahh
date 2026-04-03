import type { AhhCommand } from "../../../../types/command";
import { configureLLM } from "./main";

export const aiConfigureCommand: AhhCommand = {
  command: "configure",
  describe: "Configure LLM provider, model, and API keys.",
  meta: {
    description:
      "Interactive setup for choosing your LLM provider, model, and API key. Stored in ~/.ahh/ahh.config.json.",
    examples: [
      { command: "ahh ai configure", description: "Set up LLM provider and API key" },
    ],
    category: "ai",
  },
  handler: async () => {
    await configureLLM();
  },
};
