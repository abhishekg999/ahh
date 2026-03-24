import type { AhhCommand } from "../../types/command";
import { getConfig } from "../../config/main";
import { openAuthenticatedWebhookDashboard } from "../../utils/external";
import { color, startSpinner } from "../../utils/text";
import { tunnel } from "../tunnel/main";
import { createWebhookServer } from "./main";

export const webhookCommand: AhhCommand = {
  command: "webhook",
  describe: "Starts a webhook server.",
  handler: async () => {
    const { port, token } = await createWebhookServer(
      (await getConfig()).DEFAULT_WEBHOOK_HTTP_PORT,
    );
    const stopSpin = startSpinner("Starting tunnel, this may take a second...");
    const { url: tunnelUrl } = await tunnel(port);
    stopSpin();

    console.info("Webhook URL", color(tunnelUrl, "cyan"));

    if (!tunnelUrl) {
      console.error("Failed to create tunnel.");
      return;
    }
    await openAuthenticatedWebhookDashboard(token, tunnelUrl);
  },
};
