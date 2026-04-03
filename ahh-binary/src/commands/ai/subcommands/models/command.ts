import type { AhhCommand } from "../../../../types/command";
import { browseModels } from "./main";

export const aiModelsCommand: AhhCommand = {
  command: "models",
  describe: "Browse available LLM models from litellm.",
  meta: {
    description:
      "Lists all available LLM models from litellm's model registry with an interactive browser.",
    examples: [
      { command: "ahh ai models", description: "Browse available models" },
    ],
    category: "ai",
  },
  handler: async () => {
    await browseModels();
  },
};
