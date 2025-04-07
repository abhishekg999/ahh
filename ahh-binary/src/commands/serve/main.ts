import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import mime from "mime/lite";
import { join } from "path";
import { cwd } from "process";

export async function createSimpleServer(port: number) {
  const server = new Elysia()
    .use(cors())
    .get("*", async (ctx) => {
      try {
        let pathname = new URL(ctx.request.url).pathname;
        let safePath = join(cwd(), pathname).replace(/\.\./g, "");

        // Check if the path is a directory
        if (pathname.endsWith("/")) {
          const indexPath = join(safePath, "index.html");
          if (existsSync(indexPath)) {
            safePath = indexPath;
          }
        }

        if (!safePath.startsWith(cwd())) {
          return new Response("Forbidden", { status: 403 });
        }

        const file = await readFile(safePath);
        const contentType =
          mime.getType(safePath) || "application/octet-stream";

        return new Response(file, {
          headers: {
            "Content-Type": contentType,
          },
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return new Response("Not Found", { status: 404 });
        }
        return new Response("Internal Server Error", { status: 500 });
      }
    })
    .listen(port);

  const kill = () => {
    server.stop();
  };

  return { port, kill };
}
