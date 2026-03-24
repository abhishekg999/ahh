import type { AhhCommand } from "../../../../types/command";
import { browseModels } from "./main";

export const aiModelsCommand: AhhCommand = {
  command: "models",
  describe: "Browse available LLM models from litellm.",
  handler: async () => {
    await browseModels();
  },
};
