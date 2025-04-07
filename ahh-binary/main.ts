import { $ } from "bun";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { copyToClipboard } from "./src/commands/clip/main";
import { createSimpleServer } from "./src/commands/serve/main";
import {
  configureWebhook,
  selectWebhook,
  sendToDiscord,
} from "./src/commands/share-discord/main";
import { tunnel } from "./src/commands/tunnel/main";
import { createWebhookServer } from "./src/commands/webhook/main";
import { WORKSPACE_CHOICES } from "./src/commands/workspace/choices";
import { initWorkspace } from "./src/commands/workspace/main";
import { getConfig } from "./src/config/main";
import {
  INSTALL_SCRIPT_LINK,
  RELEASES_URL,
  UPDATE_SCRIPT,
} from "./src/constants/main";
import { openAuthenticatedWebhookDashboard } from "./src/utils/external";
import { getStdin } from "./src/utils/fs";
import { isSemver, semverCompare } from "./src/utils/semver";
import { color, generateQrcode, startSpinner } from "./src/utils/text";

// Increment this version number when making changes to the CLI
const VERSION = "1.0.3";

const main = yargs(hideBin(Bun.argv))
  .scriptName("ahh")
  .version(VERSION)
  .command(
    "tunnel",
    "Tunnel a local port.",
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
  .hide("version")
  .command(
    "serve",
    "Serve the current directory over HTTP.",
    (yargs) =>
      yargs.option("port", {
        alias: "p",
        type: "number",
        description: "Port to run the server on",
        default: 8000,
      }),
    async (argv) => {
      const stopSpin = startSpinner(
        "Starting server, this may take a second..."
      );
      const [, { url: tunnelUrl }] = await Promise.all([
        createSimpleServer(argv.port),
        tunnel(argv.port),
      ]);
      stopSpin();

      if (tunnelUrl) {
        console.info(`URL: ${tunnelUrl}`);
        await generateQrcode(tunnelUrl);
      }
    }
  )
  .hide("version")
  .command("webhook", "Starts a webhook server.", async (argv) => {
    const { port, token } = await createWebhookServer(
      (
        await getConfig()
      ).DEFAULT_WEBHOOK_HTTP_PORT
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
  .hide("version")
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
  .hide("version")
  .command("clip", "Copy any stdin to the clipboard.", async () => {
    const input = await getStdin();
    await copyToClipboard(input);
  })
  .hide("version")
  .command(
    "share-discord",
    "Share content through Discord webhook.",
    (yargs) =>
      yargs.option("configure", {
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
  .hide("version")
  .command("qr", "Generate a QR code from stdin.", async () => {
    const input = await getStdin();
    await generateQrcode(input);
  })
  .hide("version")
  .command("update", "Update the CLI.", async () => {
    const doError = (): void => {
      console.error("Unexpected response from server.");
      console.log("You can manually update using:");
      console.log(color(UPDATE_SCRIPT, "magenta"));
    };

    const release = await fetch(RELEASES_URL, { redirect: "manual" });
    if (release.status !== 302) {
      return doError();
    }

    const location = release.headers.get("location");
    if (!location) {
      return doError();
    }
    const latestVersion = location.split("tag/ahh_v")[1];
    if (!latestVersion) {
      return doError();
    }
    const currentVersion = VERSION;

    if (!isSemver(latestVersion)) {
      return doError();
    }

    if (semverCompare(currentVersion, latestVersion, ">=")) {
      console.info(
        color(`You are already on the latest version (v${VERSION}).`, "green")
      );
      return;
    } else {
      console.info(
        color(
          `New version available: ${latestVersion}. You are on ${currentVersion}.`,
          "yellow"
        )
      );
    }

    const result = await $`curl -fsSL ${INSTALL_SCRIPT_LINK} | bash`.nothrow();
    if (result.exitCode !== 0) {
      return doError();
    }

    console.info(
      color(
        `Update complete. Please restart your terminal to use the new version.`,
        "green"
      )
    );
  })
  .hide("version")
  .demandCommand(1, "You must specify a command.")
  .help()
  .strict();

if (process.env.AHH_COMPLETIONS) {
  main.showCompletionScript();
  process.exit(0);
}

main.parse();
