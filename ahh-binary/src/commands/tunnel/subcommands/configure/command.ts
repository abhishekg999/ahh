import type { AhhCommand } from "../../../../types/command";
import { tunnelConfigure } from "./main";

export const tunnelConfigureCommand: AhhCommand = {
  command: "configure",
  describe: "Set up a named Cloudflare tunnel with a custom domain.",
  handler: async () => {
    await tunnelConfigure();
  },
};
