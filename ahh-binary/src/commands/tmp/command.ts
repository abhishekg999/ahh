import type { AhhCommand } from "../../types/command";
import { enterTempDir } from "./main";

interface TmpArgs {
  prefix: string;
}

export const tmpCommand: AhhCommand<TmpArgs> = {
  command: "tmp",
  describe: "Create a temp directory and drop into it.",
  builder: (yargs) =>
    yargs.option("prefix", {
      alias: "p",
      type: "string",
      description: "Prefix for the temp directory name",
      default: "ahh",
    }),
  handler: async (argv) => {
    await enterTempDir(argv.prefix);
  },
};
