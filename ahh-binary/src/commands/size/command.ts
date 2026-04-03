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
  meta: {
    description:
      "Displays file and directory sizes with color-coded output. Defaults to the current directory. Shows a total at the end unless disabled.",
    examples: [
      { command: "ahh size", description: "Show sizes in the current directory" },
      { command: "ahh size ./src", description: "Show sizes in a specific directory" },
      { command: "ahh size --no-total", description: "Hide the total line" },
    ],
    category: "utility",
  },
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
