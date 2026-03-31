import type { AhhCommand } from "../../../../types/command";
import { tunnelLogin } from "./main";

export const tunnelLoginCommand: AhhCommand = {
  command: "login",
  describe: "Authenticate cloudflared with your Cloudflare account.",
  handler: async () => {
    await tunnelLogin();
  },
};
