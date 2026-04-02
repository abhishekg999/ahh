import { eq } from "drizzle-orm";
import { getConfig } from "../../config/main";
import type { AppConfig } from "../../config/types";
import { cloudflared } from "../../externals/cloudflared";
import {
  getDb,
  pruneStaleMappings,
  getActiveMappingCount,
} from "../../db/main";
import { tunnelMappings } from "../../db/schema";
import { generateSubdomain } from "./words";
import { ensureDaemon, stopDaemon } from "./daemon";

const QUICK_TUNNEL_REGEX = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/;

function matchTunnelUrl(url: string): string | null {
  const match = url.match(QUICK_TUNNEL_REGEX);
  return match ? match[0] : null;
}

async function quickTunnel(port: number) {
  const url = `http://localhost:${port}`;
  const proc = await cloudflared.invoke(["tunnel", "--url", url], {
    stderr: "pipe",
  });

  const reader = proc.stderr.getReader();
  const decoder = new TextDecoder();

  let tunnelUrl: string | null = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);

    if (
      text.includes("invalid character 'e'") ||
      text.includes("429 Too Many Requests")
    ) {
      console.error(
        "Rate limited creating free tunnel. Run `ahh tunnel configure` to use your own domain.",
      );
      break;
    }

    if (!tunnelUrl) tunnelUrl = matchTunnelUrl(text);
    if (text.includes("Registered tunnel connection") && tunnelUrl) {
      return {
        url: tunnelUrl,
        kill: proc.kill,
      };
    }
  }

  return {};
}

async function namedTunnel(
  port: number,
  tunnelConfig: NonNullable<AppConfig["TUNNEL"]>,
  name?: string,
) {
  const db = getDb();

  // Clean up dead entries
  pruneStaleMappings();

  // Resolve subdomain
  let subdomain: string;
  if (name) {
    // Check for collision
    const existing = db
      .select()
      .from(tunnelMappings)
      .where(eq(tunnelMappings.subdomain, name))
      .get();
    if (existing) {
      console.error(
        `Subdomain "${name}" is already in use (port ${existing.port}, pid ${existing.pid}).`,
      );
      process.exit(1);
    }
    subdomain = name;
  } else {
    // Generate random, re-roll on collision
    subdomain = generateSubdomain();
    while (
      db
        .select()
        .from(tunnelMappings)
        .where(eq(tunnelMappings.subdomain, subdomain))
        .get()
    ) {
      subdomain = generateSubdomain();
    }
  }

  // Register mapping
  db.insert(tunnelMappings).values({ subdomain, port, pid: process.pid }).run();

  // Ensure the shared daemon is running
  await ensureDaemon(tunnelConfig);

  const url = `http://${subdomain}.${tunnelConfig.hostname}`;

  // Cleanup handler
  const cleanup = () => {
    try {
      db.delete(tunnelMappings)
        .where(eq(tunnelMappings.subdomain, subdomain))
        .run();
    } catch {}

    // If we were the last mapping, stop the daemon
    try {
      if (getActiveMappingCount() === 0) {
        stopDaemon();
      }
    } catch {}
  };

  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });
  process.on("exit", cleanup);

  return { url, subdomain, kill: cleanup };
}

interface TunnelResult {
  url?: string;
  subdomain?: string;
  kill?: () => void;
}

export async function tunnel(
  port: number,
  name?: string,
): Promise<TunnelResult> {
  const config = await getConfig();

  if (config.TUNNEL) {
    return namedTunnel(port, config.TUNNEL, name);
  }

  return quickTunnel(port);
}
