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
  meta: {
    description:
      "Generates a cryptographically random string in the specified encoding. Defaults to 32 characters of alphanumeric output. Supports hex, base64url, and alphabetic-only modes.",
    examples: [
      { command: "ahh rand", description: "Generate a 32-char alphanumeric string" },
      { command: "ahh rand 64 --hex", description: "Generate a 64-char hex string" },
      { command: "ahh rand 16 --base64", description: "Generate a 16-char base64url string" },
      { command: "ahh rand 8 --alpha", description: "Generate an 8-char letters-only string" },
    ],
    category: "generation",
  },
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
