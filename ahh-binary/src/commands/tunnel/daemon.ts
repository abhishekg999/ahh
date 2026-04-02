import { unlink } from "fs/promises";
import { resource } from "../../utils/fs";
import type { AppConfig } from "../../config/types";
import {
  writeCloudflaredConfig,
  getCloudflaredConfigPath,
} from "./cloudflared-config";
import { cloudflared } from "../../externals/cloudflared";
import { startRouter } from "./router";
import { isProcessAlive, pruneStaleMappings } from "./mappings";

type TunnelConfig = NonNullable<AppConfig["TUNNEL"]>;

const PID_FILE = resource("tunnel/daemon.pid");
const DEFAULT_ROUTER_PORT = 4800;

async function readPidFile(): Promise<number | null> {
  try {
    const content = await Bun.file(PID_FILE).text();
    const pid = parseInt(content.trim(), 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

export async function isDaemonRunning(): Promise<boolean> {
  const pid = await readPidFile();
  if (!pid) return false;
  return isProcessAlive(pid);
}

function buildDaemonCommand(routerPort: number): string[] {
  const runtime = process.argv[0];
  const entry = Bun.main;

  // Compiled binary: runtime and entry are the same
  // Dev mode (bun main.ts): need to include the script path
  if (runtime === entry || entry.endsWith(runtime)) {
    return [runtime, "tunnel", "__daemon", String(routerPort)];
  }
  return [runtime, entry, "tunnel", "__daemon", String(routerPort)];
}

export async function ensureDaemon(tunnelConfig: TunnelConfig): Promise<void> {
  if (await isDaemonRunning()) return;

  const routerPort = tunnelConfig.routerPort ?? DEFAULT_ROUTER_PORT;

  // Write cloudflared config before spawning daemon
  await writeCloudflaredConfig(tunnelConfig.id, routerPort);

  const cmd = buildDaemonCommand(routerPort);
  const proc = Bun.spawn(cmd, {
    stdout: "ignore",
    stderr: "ignore",
    stdin: "ignore",
  });

  // Give daemon a moment to start and write its PID file
  await Bun.sleep(1000);

  // Detach — don't keep parent waiting
  proc.unref();
}

export async function stopDaemon(): Promise<void> {
  const pid = await readPidFile();
  if (!pid) return;

  try {
    process.kill(pid, "SIGTERM");
  } catch {}

  try {
    await unlink(PID_FILE);
  } catch {}
}

/**
 * Entry point for the daemon process itself.
 * Called via `ahh tunnel __daemon <routerPort>`.
 */
export async function runDaemon(
  routerPort: number,
  tunnelConfig: TunnelConfig,
): Promise<void> {
  // Write PID file
  await Bun.write(PID_FILE, String(process.pid));

  // Prune stale mappings on startup
  pruneStaleMappings();

  // Start router proxy
  const router = startRouter(routerPort, tunnelConfig.hostname);

  // Start cloudflared
  const configPath = getCloudflaredConfigPath();
  const cf = await cloudflared.invoke(
    ["tunnel", "--config", configPath, "run"],
    { stdout: "ignore", stderr: "ignore" },
  );

  const cleanup = async () => {
    router.stop();
    try {
      cf.kill();
    } catch {}
    try {
      await unlink(PID_FILE);
    } catch {}
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Keep alive — wait for cloudflared to exit (shouldn't normally)
  await cf.exited;
  await cleanup();
}
