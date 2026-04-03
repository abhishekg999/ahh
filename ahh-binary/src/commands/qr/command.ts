import type { AhhCommand } from "../../types/command";
import { getStdin } from "../../utils/fs";
import { writeQRCode } from "./main";

export const qrCommand: AhhCommand = {
  command: "qr",
  describe: "Generate a QR code from stdin.",
  meta: {
    description:
      "Reads text from stdin and renders a QR code directly in the terminal. Useful for quickly sharing URLs or short strings with a phone.",
    examples: [
      {
        command: "echo 'https://example.com' | ahh qr",
        description: "Generate a QR code for a URL",
      },
      {
        command: "cat secret.txt | ahh qr",
        description: "Generate a QR code from file contents",
      },
    ],
    category: "generation",
  },
  handler: async () => {
    const input = await getStdin();
    await writeQRCode(input);
  },
};
