import type { AhhCommand } from "../../types/command";
import { configureSettings } from "./main";

export const settingsCommand: AhhCommand = {
  command: "settings",
  describe: "Configure ahh settings.",
  handler: async () => {
    await configureSettings();
  },
};
