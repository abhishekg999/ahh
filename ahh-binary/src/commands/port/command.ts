import type { AhhCommand } from "../../types/command";
import {
  getProcessOnPort,
  killProcess,
  listListeningPorts,
  printPortList,
  printProcessInfo,
} from "./main";

interface PortArgs {
  target: string;
  kill?: boolean;
  signal: string;
}

export const portCommand: AhhCommand<PortArgs> = {
  command: "port <target>",
  describe: "Inspect and manage processes on ports.",
  builder: (yargs) =>
    yargs
      .positional("target", {
        type: "string",
        description: "Port number or 'list'",
        demandOption: true,
      })
      .option("kill", {
        alias: "k",
        type: "boolean",
        description: "Kill the process on this port",
      })
      .option("signal", {
        alias: "s",
        type: "string",
        description: "Signal to send with --kill",
        default: "SIGTERM",
      }),
  handler: async (argv) => {
    if (argv.target === "list") {
      const entries = await listListeningPorts();
      printPortList(entries);
      return;
    }

    const port = parseInt(argv.target, 10);
    if (isNaN(port)) {
      console.error(`Invalid port: ${argv.target}`);
      process.exit(1);
    }

    const info = await getProcessOnPort(port);
    if (!info) {
      console.log(`Nothing on port ${port}.`);
      return;
    }

    printProcessInfo(port, info);

    if (argv.kill) {
      killProcess(info.pid, argv.signal);
      console.log(`\nKilled process ${info.pid}.`);
    }
  },
};
