import type { ElysiaWS } from "elysia/ws";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { randomUUID } from "crypto";
import { createCertificate, type CertificateCreationResult } from "pem";
import { serve } from "bun";

async function getTLSCert(): Promise<CertificateCreationResult> {
  return new Promise((resolve, reject) => {
    createCertificate({ days: 1, selfSigned: true }, (err, keys) => {
      if (err) {
        return reject(err);
      }
      resolve(keys);
    });
  });
}

export async function createWebhookServer(httpPort: number, httpsPort: number) {
  const token = randomUUID();
  const wsClients = new Set<ElysiaWS>();

  const keys = await getTLSCert();

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
    });

  
  const http = serve({
    fetch: server.handle,
    port: httpPort
  })

  const https = serve({
    fetch: server.handle,
    key: keys.clientKey,
    cert: keys.certificate,
    port: httpsPort
  })

  const kill = () => {
    http.stop(true);
    https.stop(true);
  };

  return { token, httpPort, httpsPort, kill };
}
