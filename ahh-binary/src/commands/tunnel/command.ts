import type { AhhCommand } from "../../types/command";
import { generateQrcode, startSpinner } from "../../utils/text";
import { tunnel } from "./main";
import { tunnelLoginCommand } from "./subcommands/login/command";
import { tunnelConfigureCommand } from "./subcommands/configure/command";

interface TunnelArgs {
  port?: number;
}

export const tunnelCommand: AhhCommand<TunnelArgs> = {
  command: "tunnel",
  describe: "Tunnel a local port.",
  builder: (yargs) =>
    yargs
      .command(tunnelLoginCommand)
      .command(tunnelConfigureCommand)
      .option("port", {
        alias: "p",
        type: "number",
        description: "Port to tunnel",
      }),
  handler: async (argv) => {
    if (!argv.port) {
      console.error("Specify --port or a subcommand: login, configure");
      process.exit(1);
    }
    const stopSpin = startSpinner("Starting tunnel, this may take a second...");
    const { url: tunnelUrl } = await tunnel(argv.port);
    stopSpin();
    if (tunnelUrl) {
      console.info(`Tunnel URL: ${tunnelUrl}`);
      await generateQrcode(tunnelUrl);
    }
  },
};
