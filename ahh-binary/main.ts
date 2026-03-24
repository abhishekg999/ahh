import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { commands } from "./src/commands/index";
import { VERSION } from "./src/constants/main";

function isExitPrompt(err: unknown): boolean {
  return err instanceof Error && err.name === "ExitPromptError";
}

// Catch prompt interrupts that escape as unhandled rejections
process.on("unhandledRejection", (err) => {
  if (isExitPrompt(err)) process.exit(0);
  console.error(err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  if (isExitPrompt(err)) process.exit(0);
  console.error(err);
  process.exit(1);
});

const cli = yargs(hideBin(Bun.argv)).scriptName("ahh").version(VERSION);

for (const cmd of commands) {
  cli.command(cmd);
}

cli
  .hide("version")
  .demandCommand(1, "You must specify a command.")
  .help()
  .strict()
  .fail((msg, err) => {
    if (isExitPrompt(err)) process.exit(0);
    if (msg) console.error(msg);
    else if (err) console.error(err.message);
    process.exit(1);
  });

if (process.env.AHH_COMPLETIONS) {
  cli.showCompletionScript();
  process.exit(0);
}

cli.parse();
