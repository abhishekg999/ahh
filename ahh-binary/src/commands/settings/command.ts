import type { AhhCommand } from "../../types/command";
import { configureSettings } from "./main";

export const settingsCommand: AhhCommand = {
  command: "settings",
  describe: "Configure ahh settings.",
  meta: {
    description:
      "Opens an interactive prompt to view and modify ahh settings stored in ~/.ahh/ahh.config.json.",
    examples: [
      { command: "ahh settings", description: "Open the settings configurator" },
    ],
    category: "config",
  },
  handler: async () => {
    await configureSettings();
  },
};
