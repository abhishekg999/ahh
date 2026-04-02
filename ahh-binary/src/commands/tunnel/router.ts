import { eq } from "drizzle-orm";
import { appendFileSync } from "fs";
import { getDb } from "../../db/main";
import { tunnelMappings } from "../../db/schema";
import { resource } from "../../utils/fs";

const LOG_FILE = resource("tunnel.log");

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function extractSubdomain(host: string, baseHostname: string): string | null {
  const hostname = host.split(":")[0];
  const suffix = `.${baseHostname}`;
  if (!hostname.endsWith(suffix)) return null;
  const sub = hostname.slice(0, -suffix.length);
  return sub || null;
}

function log(
  subdomain: string,
  method: string,
  path: string,
  status: number,
  durationMs: number,
) {
  const time = new Date().toISOString();
  const line = `${time}\t${subdomain}\t${method}\t${path}\t${status}\t${durationMs}ms\n`;
  appendFileSync(LOG_FILE, line);
}

export function getLogFilePath(): string {
  return LOG_FILE;
}

export function startRouter(port: number, baseHostname: string) {
  const db = getDb();

  const server = Bun.serve({
    port,
    async fetch(req) {
      const host = req.headers.get("host");
      if (!host) return new Response("Bad Request", { status: 400 });

      const subdomain = extractSubdomain(host, baseHostname);
      if (!subdomain) return new Response("Not Found", { status: 404 });

      const mapping = db
        .select()
        .from(tunnelMappings)
        .where(eq(tunnelMappings.subdomain, subdomain))
        .get();

      if (!mapping) return new Response("Not Found", { status: 404 });

      const url = new URL(req.url);
      const targetUrl = `http://localhost:${mapping.port}${url.pathname}${url.search}`;
      const start = performance.now();

      try {
        const res = await fetch(targetUrl, {
          method: req.method,
          headers: (() => {
            const h = new Headers(req.headers);
            h.set("host", `localhost:${mapping.port}`);
            return h;
          })(),
          body: req.body,
          redirect: "manual",
        });

        const body = await res.arrayBuffer();
        const duration = Math.round(performance.now() - start);
        log(subdomain, req.method, url.pathname, res.status, duration);

        return new Response(body, {
          status: res.status,
          headers: res.headers,
        });
      } catch {
        const duration = Math.round(performance.now() - start);
        log(subdomain, req.method, url.pathname, 502, duration);

        if (!isProcessAlive(mapping.pid)) {
          db.delete(tunnelMappings)
            .where(eq(tunnelMappings.subdomain, subdomain))
            .run();
        }
        return new Response("Bad Gateway", { status: 502 });
      }
    },
  });

  const boundPort = server.port;
  if (boundPort === undefined) {
    throw new Error("Failed to bind router proxy to a port");
  }

  return { port: boundPort, stop: () => server.stop() };
}
