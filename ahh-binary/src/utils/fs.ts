import { mkdir } from "fs/promises";
import path from "path";

export const HOME_DIR = path.join(process.env.HOME || "/tmp", ".ahh");

if (!Bun.file(HOME_DIR).exists()) {
  await mkdir(HOME_DIR, { recursive: true });
}

if (HOME_DIR.startsWith("/tmp")) {
  console.warn(`The installation is likely incorrect. Starting ahh in /tmp.`);
}

export function resource(resource: string): string {
  return path.join(HOME_DIR, resource);
}

export async function exists(resource: string): Promise<boolean> {
  const file = Bun.file(resource);
  return await file.exists();
}
