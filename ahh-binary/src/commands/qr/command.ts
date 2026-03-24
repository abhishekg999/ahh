import type { AhhCommand } from "../../types/command";
import { getStdin } from "../../utils/fs";
import { writeQRCode } from "./main";

export const qrCommand: AhhCommand = {
  command: "qr",
  describe: "Generate a QR code from stdin.",
  handler: async () => {
    const input = await getStdin();
    await writeQRCode(input);
  },
};
