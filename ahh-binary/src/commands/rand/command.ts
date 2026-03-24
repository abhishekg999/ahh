import type { AhhCommand } from "../../types/command";
import { generateRandom } from "./main";

interface RandArgs {
  length: number;
  hex: boolean;
  base64: boolean;
  alpha: boolean;
}

export const randCommand: AhhCommand<RandArgs> = {
  command: "rand [length]",
  describe: "Generate a random string.",
  builder: (yargs) =>
    yargs
      .positional("length", {
        type: "number",
        description: "Length of the output string",
        default: 32,
      })
      .option("hex", {
        type: "boolean",
        description: "Hex output",
        default: false,
      })
      .option("base64", {
        type: "boolean",
        description: "Base64url output",
        default: false,
      })
      .option("alpha", {
        type: "boolean",
        description: "Letters only (no digits)",
        default: false,
      }),
  handler: async (argv) => {
    const mode = argv.hex
      ? "hex"
      : argv.base64
        ? "base64"
        : argv.alpha
          ? "alpha"
          : "alphanumeric";
    console.log(generateRandom(argv.length, mode));
  },
};
