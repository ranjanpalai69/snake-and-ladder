/**
 * Custom Next.js server with Socket.io embedded.
 * Boot: tsx --require ./server-setup.cjs server.ts
 * (server-setup.cjs patches globalThis.AsyncLocalStorage before next loads)
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { createSocketServer } from "./src/server/socket";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  createSocketServer(httpServer);
  console.log(`[socket] Socket.io server ready`);

  httpServer.listen(port, () => {
    console.log(`[server] Ready on http://localhost:${port} (${dev ? "dev" : "prod"})`);
  });
});
