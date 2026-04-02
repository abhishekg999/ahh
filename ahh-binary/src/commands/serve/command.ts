import type { AhhCommand } from "../../types/command";
import { tunnel } from "../tunnel/main";
import { generateQrcode, startSpinner } from "../../utils/text";
import { createSimpleServer } from "./main";

interface ServeArgs {
  port: number;
  name?: string;
}

export const serveCommand: AhhCommand<ServeArgs> = {
  command: "serve",
  describe: "Serve the current directory over HTTP.",
  builder: (yargs) =>
    yargs
      .option("port", {
        alias: "p",
        type: "number",
        description: "Port to run the server on",
        default: Number(process.env.PORT) || 8000,
      })
      .option("name", {
        alias: "n",
        type: "string",
        description: "Custom subdomain name",
      }),
  handler: async (argv) => {
    const stopSpin = startSpinner("Starting server, this may take a second...");
    const [, { url: tunnelUrl }] = await Promise.all([
      createSimpleServer(argv.port),
      tunnel(argv.port, argv.name),
    ]);
    stopSpin();

    if (tunnelUrl) {
      console.info(`URL: ${tunnelUrl}`);
      await generateQrcode(tunnelUrl);
    }
  },
};
