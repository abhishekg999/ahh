import { randomBytes } from "crypto";

type RandMode = "hex" | "base64" | "alpha" | "alphanumeric";

const ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHANUMERIC = ALPHA + "0123456789";

function fromCharset(length: number, charset: string): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  return result;
}

export function generateRandom(length: number, mode: RandMode): string {
  const byteLen = Math.ceil(length / 2);
  switch (mode) {
    case "hex":
      return randomBytes(byteLen).toString("hex").slice(0, length);
    case "base64":
      return randomBytes(length).toString("base64url").slice(0, length);
    case "alpha":
      return fromCharset(length, ALPHA);
    case "alphanumeric":
      return fromCharset(length, ALPHANUMERIC);
  }
}
