import type { AhhCommand } from "../../types/command";
import { generateQrcode, startSpinner } from "../../utils/text";
import { tunnel } from "./main";

interface TunnelArgs {
  port: number;
}

export const tunnelCommand: AhhCommand<TunnelArgs> = {
  command: "tunnel",
  describe: "Tunnel a local port.",
  builder: (yargs) =>
    yargs.option("port", {
      alias: "p",
      type: "number",
      description: "Port to run the server on",
      demandOption: true,
    }),
  handler: async (argv) => {
    const stopSpin = startSpinner("Starting tunnel, this may take a second...");
    const { url: tunnelUrl } = await tunnel(argv.port);
    stopSpin();
    if (tunnelUrl) {
      console.info(`Tunnel URL: ${tunnelUrl}`);
      await generateQrcode(tunnelUrl);
    }
  },
};
