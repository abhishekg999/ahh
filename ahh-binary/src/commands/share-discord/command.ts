import type { AhhCommand } from "../../types/command";
import { getStdin } from "../../utils/fs";
import { configureWebhook, selectWebhook, sendToDiscord } from "./main";

interface ShareDiscordArgs {
  configure?: boolean;
}

export const shareDiscordCommand: AhhCommand<ShareDiscordArgs> = {
  command: "share-discord",
  describe: "Share content through Discord webhook.",
  builder: (yargs) =>
    yargs.option("configure", {
      alias: "c",
      type: "boolean",
      description: "Configure webhooks",
    }),
  handler: async (argv) => {
    if (argv.configure) {
      await configureWebhook();
      return;
    }
    const webhookUrl = await selectWebhook();
    const content = await getStdin();
    await sendToDiscord(content, webhookUrl);
  },
};
