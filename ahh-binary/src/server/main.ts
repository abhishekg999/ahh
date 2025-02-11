import type { ElysiaWS } from "elysia/ws";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { randomUUID } from "crypto";

export async function createWebhookServer(port: number) {
  const token = randomUUID();
  const wsClients = new Set<ElysiaWS>();

  const server = new Elysia()
    .use(cors({ origin: /cli\.ahh\.bet$/ }))
    .get("/ws", () => {
      return "OK";
    })
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
      return "OK";
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

  const kill = () => {
    server.stop(true);
  };

  return { token, port, kill };
}
