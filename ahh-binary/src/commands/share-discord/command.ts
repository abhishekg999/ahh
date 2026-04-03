import type { AhhCommand } from "../../types/command";
import { getStdin } from "../../utils/fs";
import { configureWebhook, selectWebhook, sendToDiscord } from "./main";

interface ShareDiscordArgs {
  configure?: boolean;
}

export const shareDiscordCommand: AhhCommand<ShareDiscordArgs> = {
  command: "share-discord",
  describe: "Share content through Discord webhook.",
  meta: {
    description:
      "Sends stdin content to a Discord channel via a saved webhook URL. Use --configure to add or manage webhook URLs.",
    examples: [
      { command: "echo 'deploy done' | ahh share-discord", description: "Send a message to Discord" },
      { command: "ahh share-discord --configure", description: "Add or manage webhook URLs" },
    ],
    category: "utility",
  },
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
