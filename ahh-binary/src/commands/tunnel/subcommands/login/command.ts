import type { AhhCommand } from "../../../../types/command";
import { tunnelLogin } from "./main";

export const tunnelLoginCommand: AhhCommand = {
  command: "login",
  describe: "Authenticate cloudflared with your Cloudflare account.",
  meta: {
    description:
      "Opens a browser to authenticate cloudflared with your Cloudflare account. Required before using named tunnels with custom domains.",
    examples: [
      { command: "ahh tunnel login", description: "Authenticate with Cloudflare" },
    ],
    category: "networking",
  },
  handler: async () => {
    await tunnelLogin();
  },
};
