import type { AhhCommand } from "../../types/command";
import { getConfig } from "../../config/main";
import { openAuthenticatedWebhookDashboard } from "../../utils/external";
import { color, startSpinner } from "../../utils/text";
import { tunnel } from "../tunnel/main";
import { createWebhookServer } from "./main";

interface WebhookArgs {
  name?: string;
}

export const webhookCommand: AhhCommand<WebhookArgs> = {
  command: "webhook",
  describe: "Starts a webhook server.",
  builder: (yargs) =>
    yargs.option("name", {
      alias: "n",
      type: "string",
      description: "Custom subdomain name",
    }),
  handler: async (argv) => {
    const { port, token } = await createWebhookServer(
      (await getConfig()).DEFAULT_WEBHOOK_HTTP_PORT,
    );
    const stopSpin = startSpinner("Starting tunnel, this may take a second...");
    const { url: tunnelUrl } = await tunnel(port, argv.name);
    stopSpin();

    if (!tunnelUrl) {
      console.error("Failed to create tunnel.");
      return;
    }

    console.info("Webhook URL", color(tunnelUrl, "cyan"));
    await openAuthenticatedWebhookDashboard(token, tunnelUrl, port);
  },
};
