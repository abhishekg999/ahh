import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { randomUUID } from "crypto";
import type { ElysiaWS } from "elysia/ws";

export async function createWebhookServer(port: number) {
  const token = randomUUID();
  const wsClients = new Set<ElysiaWS>();

  const server = new Elysia()
    .use(cors({ origin: /cli\.ahh\.bet$/ }))
    .all("*", (ctx) => {
      const logData = {
        id: randomUUID(),
        method: ctx.request.method,
        path: ctx.request.url,
        timestamp: new Date().toISOString(),
        headers: ctx.headers,
        query: ctx.query,
        body: ctx.body || "",
      };

      wsClients.forEach((ws) => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify(logData));
        }
      });
      return logData;
    })
    .ws("/ws", {
      message(ws, message) {
        if (token !== message) {
          ws.terminate();
          return;
        }
        wsClients.add(ws);
        ws.send('"OK"');
      },
      close(ws) {
        wsClients.delete(ws);
      },
    })
    .listen(port);

  const url = `http://localhost:${port}`;
  const kill = () => {
    if (!server) {
      console.warn("Tried to stop a stopped server... Continuing.");
      return;
    }
    server.stop();
  };
  return { token, url, port, kill };
}
