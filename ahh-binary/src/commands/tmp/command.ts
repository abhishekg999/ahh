import type { AhhCommand } from "../../types/command";
import { enterTempDir } from "./main";

interface TmpArgs {
  prefix: string;
}

export const tmpCommand: AhhCommand<TmpArgs> = {
  command: "tmp",
  describe: "Create a temp directory and drop into it.",
  meta: {
    description:
      "Creates a temporary directory and spawns a new shell inside it. When the shell exits, the directory remains for later cleanup. Useful for quick throwaway experiments.",
    examples: [
      { command: "ahh tmp", description: "Create a temp dir with default 'ahh' prefix" },
      { command: "ahh tmp -p myproject", description: "Create a temp dir with custom prefix" },
    ],
    category: "utility",
  },
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
