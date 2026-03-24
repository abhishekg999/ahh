import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { commands } from "./src/commands/index";
import { VERSION } from "./src/constants/main";

const cli = yargs(hideBin(Bun.argv)).scriptName("ahh").version(VERSION);

for (const cmd of commands) {
  cli.command(cmd);
}

cli
  .hide("version")
  .demandCommand(1, "You must specify a command.")
  .help()
  .strict();

if (process.env.AHH_COMPLETIONS) {
  cli.showCompletionScript();
  process.exit(0);
}

cli.parse();
