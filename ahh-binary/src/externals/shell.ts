import path from "path";
import { SystemBinary } from "./system-binary";

const shellPath = process.env.SHELL || "bash";

export const shell = new SystemBinary(shellPath);

export function interactiveShellArgs(command: string, loadConfig: boolean) {
  if (loadConfig) return [];

  switch (path.basename(command)) {
    case "zsh":
      return ["--no-rcs"];
    case "bash":
      return ["--norc"];
    case "fish":
      return ["--no-config"];
    default:
      return [];
  }
}

export function currentInteractiveShellArgs(loadConfig: boolean) {
  return interactiveShellArgs(shellPath, loadConfig);
}
