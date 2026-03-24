import type { AhhCommand } from "../../types/command";
import { resolvePath } from "../../utils/path";
import { computeSizes, printSizes } from "./main";

interface SizeArgs {
  path: string;
  total: boolean;
}

export const sizeCommand: AhhCommand<SizeArgs> = {
  command: "size [path]",
  describe: "Show file and directory sizes with color.",
  builder: (yargs) =>
    yargs
      .positional("path", {
        type: "string",
        description: "File or directory to measure",
        default: ".",
      })
      .option("total", {
        alias: "t",
        type: "boolean",
        description: "Show total at the end",
        default: true,
      }),
  handler: async (argv) => {
    const target = resolvePath(argv.path);
    const entries = await computeSizes(target);
    printSizes(entries, argv.total);
  },
};
