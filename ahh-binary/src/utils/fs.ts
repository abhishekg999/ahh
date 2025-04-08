import { mkdir, stat } from "fs/promises";
import path from "path";
import { resolvePath } from "./path";

export const HOME_DIR = path.join(process.env.HOME || "/tmp", ".ahh");

/**
 * Creates a directory and all parent directories if they don't exist
 * Handles both absolute and relative paths
 */
export function mkdirAlways(dir: string) {
  const resolvedDir = resolvePath(dir);
  return mkdir(resolvedDir, { recursive: true });
}

/**
 * Check if file or directory exists
 * Handles both absolute and relative paths
 */
export async function exists(resourcePath: string): Promise<boolean> {
  try {
    const resolvedPath = resolvePath(resourcePath);
    await stat(resolvedPath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Joins a resource path with a base directory
 * Useful for creating paths within the ahh home directory
 */
export function resource(resource: string, base: string = HOME_DIR): string {
  return path.join(base, resource);
}

/**
 * Get input from standard input
 */
export async function getStdin(): Promise<string> {
  return await new Promise<string>((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

// Create home directory if it doesn't exist
if (!Bun.file(HOME_DIR).exists()) {
  await mkdirAlways(HOME_DIR);
}

if (HOME_DIR.startsWith("/tmp")) {
  console.warn(`The installation is likely incorrect. Starting ahh in /tmp.`);
}
