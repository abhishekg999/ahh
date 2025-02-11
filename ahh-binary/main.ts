import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { tunnel } from "./src/tunnel/main";
import { createServer } from "./src/server/main";
import { startSpinner } from "./src/utils/text";
import { loadConfig } from "./src/config/main";

const config = await loadConfig();

yargs(hideBin(Bun.argv))
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
  .command(
    "webhook",
    "Starts a webhook server.",
    (yargs) =>
      yargs.option("port", {
        alias: "p",
        type: "number",
        description: "Port to run the server on",
        default: config.DEFAULT_WEBHOOK_PORT,
      }),
    async (argv) => {
      const { url, port } = createServer(argv.port);
      console.info(`Local webhook server running on port ${url}`);

      const stopSpin = startSpinner(
        "Starting tunnel, this may take a second..."
      );
      const { url: tunnelUrl } = await tunnel(port);
      stopSpin();

      if (tunnelUrl) {
        console.info(`Tunnel URL: ${tunnelUrl}`);
      }
    }
  )
  .demandCommand(1, "You must specify a command")
  .help()
  .strict()
  .parse();
