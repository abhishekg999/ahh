import type { AhhCommand } from "../../../../types/command";
import { configureLLM } from "./main";

export const aiConfigureCommand: AhhCommand = {
  command: "configure",
  describe: "Configure LLM provider, model, and API keys.",
  handler: async () => {
    await configureLLM();
  },
};
