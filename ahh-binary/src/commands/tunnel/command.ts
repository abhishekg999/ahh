import type { AhhCommand } from "../../types/command";
import { getConfig } from "../../config/main";
import { color, generateQrcode, startSpinner } from "../../utils/text";
import { tunnel } from "./main";
import { runDaemon } from "./daemon";
import { tailLogs } from "./log";
import { tunnelLoginCommand } from "./subcommands/login/command";
import { tunnelConfigureCommand } from "./subcommands/configure/command";

interface TunnelArgs {
  port?: number;
  name?: string;
}

const tunnelDaemonCommand: AhhCommand<{ port: number }> = {
  command: "__daemon <port>",
  describe: false as any,
  builder: (yargs) =>
    yargs.positional("port", {
      type: "number",
      demandOption: true,
    }),
  handler: async (argv) => {
    const config = await getConfig();
    if (!config.TUNNEL) {
      console.error("No tunnel configured.");
      process.exit(1);
    }
    await runDaemon(argv.port, config.TUNNEL);
  },
};

export const tunnelCommand: AhhCommand<TunnelArgs> = {
  command: "tunnel",
  describe: "Tunnel a local port.",
  builder: (yargs) =>
    yargs
      .command(tunnelLoginCommand)
      .command(tunnelConfigureCommand)
      .command(tunnelDaemonCommand)
      .option("port", {
        alias: "p",
        type: "number",
        description: "Port to tunnel",
      })
      .option("name", {
        alias: "n",
        type: "string",
        description: "Custom subdomain name",
      }),
  handler: async (argv) => {
    if (!argv.port) {
      console.error("Specify --port or a subcommand: login, configure");
      process.exit(1);
    }
    const stopSpin = startSpinner("Starting tunnel, this may take a second...");
    const { url: tunnelUrl, subdomain } = await tunnel(argv.port, argv.name);
    stopSpin();
    if (tunnelUrl && subdomain) {
      console.info(`Tunnel URL: ${tunnelUrl}`);
      await generateQrcode(tunnelUrl);
      console.info(color("Logging requests...\n", "cyan"));
      tailLogs(subdomain);
    }
  },
};
