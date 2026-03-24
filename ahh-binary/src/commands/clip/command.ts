import type { AhhCommand } from "../../types/command";
import { getStdin } from "../../utils/fs";
import { copyToClipboard } from "./main";

export const clipCommand: AhhCommand = {
  command: "clip",
  describe: "Copy any stdin to the clipboard.",
  handler: async () => {
    const input = await getStdin();
    await copyToClipboard(input);
  },
};
