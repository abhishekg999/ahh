import type { ExternalBinary } from "../../externals/external-binary";
import { lsof } from "../../externals/lsof";
import { ps } from "../../externals/ps";
import { color } from "../../utils/text";

interface ProcessInfo {
  pid: number;
  command: string;
  user: string;
}

interface PortEntry {
  port: number;
  pid: number;
  command: string;
}

async function exec(bin: ExternalBinary, args: string[]): Promise<string> {
  const proc = await bin.invoke(args, { stdout: "pipe", stderr: "ignore" });
  const output = await new Response(proc.stdout).text();
  await proc.exited;
  return output.trim();
}

export async function getProcessOnPort(
  port: number,
): Promise<ProcessInfo | null> {
  const pidStr = await exec(lsof, [
    `-iTCP:${port}`,
    "-sTCP:LISTEN",
    "-P",
    "-n",
    "-t",
  ]);
  if (!pidStr) return null;

  const pid = parseInt(pidStr.split("\n")[0], 10);
  if (isNaN(pid)) return null;

  const [command, user] = await Promise.all([
    exec(ps, ["-p", String(pid), "-o", "comm="]),
    exec(ps, ["-p", String(pid), "-o", "user="]),
  ]);

  return {
    pid,
    command: command || "unknown",
    user: user || "unknown",
  };
}

export async function listListeningPorts(): Promise<PortEntry[]> {
  const output = await exec(lsof, [
    "+c",
    "0",
    "-iTCP",
    "-sTCP:LISTEN",
    "-P",
    "-n",
  ]);
  if (!output) return [];

  const lines = output.split("\n").slice(1);
  const entries: PortEntry[] = [];
  const seen = new Set<number>();

  for (const line of lines) {
    const columns = line.split(/\s+/);
    if (columns.length < 9) continue;

    const command = columns[0].replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
    const pid = parseInt(columns[1], 10);
    const name = columns[columns.length - 2];

    const portMatch = name.match(/:(\d+)$/);
    if (!portMatch) continue;

    const port = parseInt(portMatch[1], 10);
    if (seen.has(port)) continue;
    seen.add(port);

    entries.push({ port, pid, command });
  }

  return entries.sort((a, b) => a.port - b.port);
}

export function killProcess(pid: number, signal: string): void {
  process.kill(pid, signal as NodeJS.Signals);
}

export function printProcessInfo(port: number, info: ProcessInfo): void {
  console.log(`Port ${color(port, "cyan")}`);
  console.log(`  PID      ${info.pid}`);
  console.log(`  Command  ${info.command}`);
  console.log(`  User     ${info.user}`);
}

export function printPortList(entries: PortEntry[]): void {
  if (entries.length === 0) {
    console.log("No listening ports.");
    return;
  }

  const portWidth = Math.max(4, ...entries.map((e) => String(e.port).length));
  const pidWidth = Math.max(3, ...entries.map((e) => String(e.pid).length));

  console.log(
    `${"PORT".padEnd(portWidth + 2)}${"PID".padEnd(pidWidth + 2)}COMMAND`,
  );

  for (const entry of entries) {
    console.log(
      `${String(entry.port).padEnd(portWidth + 2)}${String(entry.pid).padEnd(pidWidth + 2)}${entry.command}`,
    );
  }
}
