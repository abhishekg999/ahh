import { eq } from "drizzle-orm";
import { appendFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { getDb } from "../../db/main";
import { tunnelMappings } from "../../db/schema";
import { resource } from "../../utils/fs";
import { isProcessAlive } from "./mappings";

const LOG_FILE = resource("tunnel/tunnel.log");
mkdirSync(dirname(LOG_FILE), { recursive: true });

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

/**
 * Extract subdomain from a /ws/<subdomain> path on the root hostname.
 * Used to proxy WebSocket connections through the SSL-enabled root domain.
 */
function extractWsSubdomain(
  host: string,
  pathname: string,
  baseHostname: string,
): string | null {
  const hostname = host.split(":")[0];
  // Only match the root hostname (no subdomain)
  if (hostname !== baseHostname) return null;
  const match = pathname.match(/^\/ws\/([a-zA-Z0-9-]+)$/);
  return match ? match[1] : null;
}

interface WsData {
  port: number;
  subdomain: string;
  upstream?: WebSocket;
}

export function startRouter(port: number, baseHostname: string) {
  const db = getDb();

  function lookupMapping(subdomain: string) {
    return db
      .select()
      .from(tunnelMappings)
      .where(eq(tunnelMappings.subdomain, subdomain))
      .get();
  }

  const server = Bun.serve<WsData>({
    port,
    async fetch(req, server) {
      const host = req.headers.get("host");
      if (!host) return new Response("Bad Request", { status: 400 });

      const url = new URL(req.url);

      // WebSocket proxy: wss://tunnel.ahh.bet/ws/<subdomain>
      // The root domain has SSL (covered by *.ahh.bet), so this lets
      // the HTTPS dashboard connect without mixed content issues.
      const wsSubdomain = extractWsSubdomain(host, url.pathname, baseHostname);
      if (wsSubdomain) {
        const mapping = lookupMapping(wsSubdomain);
        if (!mapping) return new Response("Not Found", { status: 404 });

        const upgraded = server.upgrade(req, {
          data: { port: mapping.port, subdomain: wsSubdomain },
        });
        if (upgraded) return undefined;
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      // Regular HTTP proxy: subdomain.tunnel.ahh.bet/*
      const subdomain = extractSubdomain(host, baseHostname);
      if (!subdomain) return new Response("Not Found", { status: 404 });

      const mapping = lookupMapping(subdomain);
      if (!mapping) return new Response("Not Found", { status: 404 });

      const targetUrl = `http://localhost:${mapping.port}${url.pathname}${url.search}`;
      const start = performance.now();

      try {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("host", `localhost:${mapping.port}`);

        const upstreamRequest = new Request(targetUrl, {
          method: req.method,
          headers: requestHeaders,
          body: req.body,
          redirect: "manual",
        });

        const res = await fetch(upstreamRequest, {
          decompress: false,
        });

        const duration = Math.round(performance.now() - start);
        log(subdomain, req.method, url.pathname, res.status, duration);

        return new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
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
    websocket: {
      async open(ws) {
        const { port: targetPort } = ws.data;
        // Connect to the local webhook server's WebSocket
        const upstream = new WebSocket(`ws://localhost:${targetPort}/ws`);

        upstream.addEventListener("message", (e) => {
          ws.send(typeof e.data === "string" ? e.data : new Uint8Array(e.data as ArrayBuffer));
        });
        upstream.addEventListener("close", () => ws.close());
        upstream.addEventListener("error", () => ws.close());

        // Store upstream ref for message forwarding
        ws.data.upstream = upstream;

        // Wait for upstream to be ready before forwarding client messages
        if (upstream.readyState !== WebSocket.OPEN) {
          await new Promise<void>((resolve, reject) => {
            upstream.addEventListener("open", () => resolve());
            upstream.addEventListener("error", () => reject());
          });
        }
      },
      message(ws, message) {
        const { upstream } = ws.data;
        if (upstream && upstream.readyState === WebSocket.OPEN) {
          upstream.send(typeof message === "string" ? message : new Uint8Array(message));
        }
      },
      close(ws) {
        const { upstream } = ws.data;
        if (upstream) upstream.close();
      },
    },
  });

  const boundPort = server.port;
  if (boundPort === undefined) {
    throw new Error("Failed to bind router proxy to a port");
  }

  return { port: boundPort, stop: () => server.stop() };
}
