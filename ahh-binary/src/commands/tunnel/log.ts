import { watch } from "fs";
import { open } from "fs/promises";
import { getLogFilePath } from "./router";

const METHOD_COLORS: Record<string, string> = {
  GET: "\x1b[32m",
  POST: "\x1b[34m",
  PUT: "\x1b[33m",
  PATCH: "\x1b[33m",
  DELETE: "\x1b[31m",
  HEAD: "\x1b[36m",
  OPTIONS: "\x1b[35m",
};

function statusColor(status: number): string {
  if (status < 300) return "\x1b[32m";
  if (status < 400) return "\x1b[36m";
  if (status < 500) return "\x1b[33m";
  return "\x1b[31m";
}

function formatLine(parts: string[]) {
  const [_time, _sub, method, path, status, duration] = parts;
  const reset = "\x1b[0m";
  const dim = "\x1b[2m";
  const methodCol = METHOD_COLORS[method] || reset;
  const statCol = statusColor(parseInt(status, 10));
  const time = new Date(_time).toLocaleTimeString();

  console.info(
    `${dim}${time}${reset} ${methodCol}${method.padEnd(7)}${reset} ${path} ${statCol}${status}${reset} ${dim}${duration}${reset}`,
  );
}

/**
 * Tail the shared tunnel log file, printing only lines matching this subdomain.
 */
export function tailLogs(subdomain: string) {
  const logFile = getLogFilePath();

  // Ensure file exists
  Bun.write(logFile, "").catch(() => {});

  let offset = 0;
  // Get current file size so we only read new lines
  try {
    const file = Bun.file(logFile);
    offset = file.size;
  } catch {}

  const readNew = async () => {
    try {
      const fh = await open(logFile, "r");
      const stat = await fh.stat();
      if (stat.size <= offset) {
        await fh.close();
        return;
      }
      const buf = Buffer.alloc(stat.size - offset);
      await fh.read(buf, 0, buf.length, offset);
      offset = stat.size;
      await fh.close();

      const lines = buf.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        const parts = line.split("\t");
        if (parts[1] === subdomain) {
          formatLine(parts);
        }
      }
    } catch {}
  };

  watch(logFile, () => readNew());
}
