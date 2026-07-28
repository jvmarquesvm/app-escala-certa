import express, { Response, NextFunction, Request } from "express";
import { createServer } from "node:http";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let ready: Promise<void> | null = null;
function init() {
  if (!ready) {
    ready = (async () => {
      const { registerRoutes } = await import("../server/routes");
      const httpServer = createServer(app);
      await registerRoutes(httpServer, app);

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error("Internal Server Error:", err);
        if (res.headersSent) return;
        res.status(status).json({ message });
      });
    })();
  }
  return ready;
}

export default async function handler(req: any, res: any) {
  try {
    await init();
    app(req, res);
  } catch (err: any) {
    ready = null;
    console.error("Init error:", err);
    res.status(500).json({ message: "Init failed", error: err?.message, stack: err?.stack });
  }
}
