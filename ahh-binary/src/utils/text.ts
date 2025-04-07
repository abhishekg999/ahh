import qrcode from "qrcode-terminal";

const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function startSpinner(text: string): () => void {
  let i = 0;
  const spinner = setInterval(() => {
    process.stdout.write(`\r${frames[i]} ${text}`);
    i = (i + 1) % frames.length;
  }, 80);

  return () => {
    clearInterval(spinner);
    process.stdout.write("\r\x1b[K");
  };
}

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

type Color = keyof typeof colors;

export function color(message: any, color: Color = "reset") {
  const colorCode = colors[color] || colors.reset;
  return `${colorCode}${message.toString()}${colors.reset}`;
}

export async function generateQrcode(text: string) {
  await qrcode.generate(text, { small: true });
}
