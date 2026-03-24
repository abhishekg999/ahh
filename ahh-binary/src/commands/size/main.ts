import { readdir, stat } from "fs/promises";
import path from "path";
import { color } from "../../utils/text";

interface SizeEntry {
  name: string;
  bytes: number;
  isDir: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "  0 B";
  const units = ["B", "K", "M", "G", "T"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, i);
  const formatted = i === 0 ? String(value) : value.toFixed(1);
  return `${formatted.padStart(6)} ${units[i]}`;
}

function colorForSize(
  bytes: number,
): "white" | "green" | "yellow" | "red" | "magenta" {
  if (bytes < 1024) return "white";
  if (bytes < 1024 * 1024) return "green";
  if (bytes < 100 * 1024 * 1024) return "yellow";
  if (bytes < 1024 * 1024 * 1024) return "red";
  return "magenta";
}

async function dirSize(dirPath: string): Promise<number> {
  let total = 0;
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const sizes = await Promise.all(
      entries.map(async (entry) => {
        const full = path.join(dirPath, entry.name);
        if (entry.isDirectory()) return dirSize(full);
        try {
          const s = await stat(full);
          return s.size;
        } catch {
          return 0;
        }
      }),
    );
    for (const s of sizes) total += s;
  } catch {
    // permission denied or similar
  }
  return total;
}

export async function computeSizes(target: string): Promise<SizeEntry[]> {
  const s = await stat(target);
  if (!s.isDirectory()) {
    return [{ name: path.basename(target), bytes: s.size, isDir: false }];
  }

  const entries = await readdir(target, { withFileTypes: true });
  const results = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(target, entry.name);
      if (entry.isDirectory()) {
        return { name: entry.name, bytes: await dirSize(full), isDir: true };
      }
      try {
        const s = await stat(full);
        return { name: entry.name, bytes: s.size, isDir: false };
      } catch {
        return { name: entry.name, bytes: 0, isDir: false };
      }
    }),
  );

  return results.sort((a, b) => b.bytes - a.bytes);
}

export function printSizes(entries: SizeEntry[], total: boolean): void {
  const maxName = Math.max(...entries.map((e) => e.name.length));

  for (const entry of entries) {
    const sizeStr = formatBytes(entry.bytes);
    const sizeColor = colorForSize(entry.bytes);
    const name = entry.isDir ? color(entry.name + "/", "cyan") : entry.name;
    console.log(`${color(sizeStr, sizeColor)}  ${name}`);
  }

  if (total && entries.length > 1) {
    const sum = entries.reduce((acc, e) => acc + e.bytes, 0);
    const sizeStr = formatBytes(sum);
    console.log(`${color(sizeStr, "bold")}  ${color("total", "bold")}`);
  }
}
