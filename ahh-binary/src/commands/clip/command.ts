import type { AhhCommand } from "../../types/command";
import { getStdin } from "../../utils/fs";
import { copyToClipboard } from "./main";

export const clipCommand: AhhCommand = {
  command: "clip",
  describe: "Copy any stdin to the clipboard.",
  meta: {
    description:
      "Reads from stdin and copies the content to the system clipboard. Works on macOS (pbcopy) and Linux (xclip/xsel).",
    examples: [
      { command: "echo 'hello' | ahh clip", description: "Copy text to clipboard" },
      { command: "cat file.txt | ahh clip", description: "Copy file contents to clipboard" },
    ],
    category: "utility",
  },
  handler: async () => {
    const input = await getStdin();
    await copyToClipboard(input);
  },
};
