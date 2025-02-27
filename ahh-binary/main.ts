import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { tunnel } from "./src/tunnel/main";
import { createWebhookServer } from "./src/webhook/main";
import { color, generateQrcode, startSpinner } from "./src/utils/text";
import { openAuthenticatedWebhookDashboard } from "./src/utils/external";

import {WORKSPACE_CHOICES} from "./src/workspace/choices";
import { initWorkspace } from "./src/workspace/main";
import { copyToClipboard } from "./src/clip/main";
import { getConfig } from "./src/config/main";
import { configureWebhook, selectWebhook, sendToDiscord } from "./src/share-discord/main";
import { getStdin } from "./src/utils/fs";

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
        await generateQrcode(tunnelUrl);
      }
    }
  )
  .command("webhook", "Starts a webhook server.", async (argv) => {
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
  })
  .command(
    "workspace <name>",
    "Initialize a workspace.",
    (yargs) =>
      yargs
      .positional("name", {
        type: "string",
        description: "Name of the workspace",
        demandOption: true,
        choices: WORKSPACE_CHOICES, 
      })
      .option("path", {
          alias: "p",
          type: "string",
          description: "Path to load the workspace",
        }),
    async (argv) => {
      const { name, path } = argv;
      const stopSpin = startSpinner("Initializing workspace...");
      await initWorkspace(name, path);
      stopSpin();
      console.log("Workspace initialized.");
    }
  )
  .command("clip", "Copy any stdin to the clipboard.", async () => {
    const input = await getStdin();
    await copyToClipboard(input);
  })
  .command(
    "share-discord",
    "Share content through Discord webhook",
    (yargs) =>
      yargs
        .option("configure", {
          alias: "c",
          type: "boolean",
          description: "Configure webhooks",
        }),
    async (argv) => {
      if (argv.configure) {
        await configureWebhook();
        return;
      }

      const webhookUrl = await selectWebhook();
      const content = await getStdin();
      
      await sendToDiscord(content, webhookUrl);
    }
  )
  .demandCommand(1, "You must specify a command.")
  .help()
  .strict()

if (process.env.AHH_COMPLETIONS) {
  main.showCompletionScript();
  process.exit(0);
}

main.parse();
