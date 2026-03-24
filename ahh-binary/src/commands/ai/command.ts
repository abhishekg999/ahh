import type { AhhCommand } from "../../types/command";
import { aiConfigureCommand } from "./subcommands/configure/command";
import { aiModelsCommand } from "./subcommands/models/command";
import { aiXCommand } from "./subcommands/x/command";

export const aiCommand: AhhCommand = {
  command: "ai",
  describe: "AI-powered tools.",
  builder: (yargs) =>
    yargs
      .command(aiXCommand)
      .command(aiModelsCommand)
      .command(aiConfigureCommand)
      .demandCommand(1, "Specify a subcommand: x, models, configure"),
  handler: () => {},
};
