import type { AhhCommand } from "../../types/command";
import { tunnel } from "../tunnel/main";
import { generateQrcode, startSpinner } from "../../utils/text";
import { createSimpleServer } from "./main";

interface ServeArgs {
  port: number;
}

export const serveCommand: AhhCommand<ServeArgs> = {
  command: "serve",
  describe: "Serve the current directory over HTTP.",
  builder: (yargs) =>
    yargs.option("port", {
      alias: "p",
      type: "number",
      description: "Port to run the server on",
      default: 8000,
    }),
  handler: async (argv) => {
    const stopSpin = startSpinner("Starting server, this may take a second...");
    const [, { url: tunnelUrl }] = await Promise.all([
      createSimpleServer(argv.port),
      tunnel(argv.port),
    ]);
    stopSpin();

    if (tunnelUrl) {
      console.info(`URL: ${tunnelUrl}`);
      await generateQrcode(tunnelUrl);
    }
  },
};
