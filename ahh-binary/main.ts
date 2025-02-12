import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { tunnel } from "./src/tunnel/main";
import { createWebhookServer } from "./src/server/main";
import { color, startSpinner } from "./src/utils/text";
import { loadConfig } from "./src/config/main";
import { openAuthenticatedWebhookDashboard } from "./src/utils/external";

const main = yargs(hideBin(Bun.argv))
  .scriptName("ahh")
  .version("1.0.0")
  .command(
    "tunnel",
    "Tunnel a local port publically using Cloudflare's free tunnel.",
    (yargs) =>
      yargs.option("port", {
        alias: "p",
        type: "number",
        description: "Port to run the server on",
        demandOption: true,
      }),
    async (argv) => {
      const stopSpin = startSpinner(
        "Starting tunnel, this may take a second..."
      );
      const { url: tunnelUrl } = await tunnel(argv.port);
      stopSpin();
      if (tunnelUrl) {
        console.info(`Tunnel URL: ${tunnelUrl}`);
      }
    }
  )
  .demandCommand(1, "You must specify a command")
  .command("webhook", "Starts a webhook server.", async (argv) => {
    const { port, token } = await createWebhookServer(
      config.DEFAULT_WEBHOOK_HTTP_PORT,
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
  })
  .demandCommand(1, "You must specify a command")
  .help()
  .strict()

if (process.env.AHH_COMPLETIONS) {
  main.showCompletionScript();
  process.exit(0);
}

const config = await loadConfig();
main.parse();
