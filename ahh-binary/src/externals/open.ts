import { isSupportedOS, OS } from "../utils/os";
import { SystemBinary } from "./system-binary";

const DEFAULT_BROWSER: Record<string, string> = {
  darwin: "open",
  win32: "start",
  linux: "xdg-open",
};

function resolveCommand(): string {
  if (process.env.BROWSER) return process.env.BROWSER;
  if (isSupportedOS(OS)) return DEFAULT_BROWSER[OS];
  return DEFAULT_BROWSER.linux;
}

export const open = new SystemBinary(resolveCommand());
