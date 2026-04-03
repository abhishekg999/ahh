import type { AhhCommand } from "../../../../types/command";
import { tunnelConfigure } from "./main";

export const tunnelConfigureCommand: AhhCommand = {
  command: "configure",
  describe: "Set up a named Cloudflare tunnel with a custom domain.",
  meta: {
    description:
      "Interactive setup for creating a named Cloudflare tunnel with wildcard DNS on your own domain. Configures the tunnel ID and domain in ~/.ahh/ahh.config.json.",
    examples: [
      { command: "ahh tunnel configure", description: "Set up a named tunnel with custom domain" },
    ],
    category: "networking",
  },
  handler: async () => {
    await tunnelConfigure();
  },
};
