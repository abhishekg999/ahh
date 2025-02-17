import { mkdir } from "fs/promises";
import path from "path";

export const HOME_DIR = path.join(process.env.HOME || "/tmp", ".ahh");
export const TLS_DIR = path.join(HOME_DIR, "webhook/tls");

export function mkdirAlways(dir: string) {
  return mkdir(dir, { recursive: true });
}

if (!Bun.file(HOME_DIR).exists()) {
  await mkdirAlways(HOME_DIR);
}

if (HOME_DIR.startsWith("/tmp")) {
  console.warn(`The installation is likely incorrect. Starting ahh in /tmp.`);
}

export function resource(resource: string, base: string = HOME_DIR): string {
  return path.join(base, resource);
}

export async function exists(resource: string): Promise<boolean> {
  const file = Bun.file(resource);
  return await file.exists();
}

export async function getStdin(): Promise<string> {
  return await new Promise<string>((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => data += chunk);
    process.stdin.on("end", () => resolve(data));
  });
}