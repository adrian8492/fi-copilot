import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { setupWebSocketServer } from "../websocket";
import { registerPdfRoutes } from "../pdf-routes";
import { createHttpStreamRouter } from "../http-stream";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust proxy (behind Manus hosting proxy)
  app.set("trust proxy", 1);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false,  // Vite handles CSP in dev
  }));

  // Gzip/Brotli compression for all responses
  app.use(compression({
    level: 6,
    threshold: 1024,  // Only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress SSE streams (they need to flush immediately)
      if (req.path.includes("/events")) return false;
      return compression.filter(req, res);
    },
  }));

  // Rate limiting on API routes
  app.use("/api/trpc", rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 200,                    // 200 requests per window
    standardHeaders: true,
  }));

  // Rate limiting on session streaming routes
  app.use("/api/session", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
  }));

  // Health check endpoint (for uptime monitoring)
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: Date.now(),
    });
  });

  // Configure body parser with reduced size limits
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // PDF download routes (REST — not tRPC, because we stream binary)
  registerPdfRoutes(app);
  // HTTP streaming fallback for live sessions (when WebSocket upgrade is blocked by proxy)
  app.use("/api/session", express.raw({ type: "application/octet-stream", limit: "5mb" }));
  app.use("/api/session", createHttpStreamRouter());
  // WebSocket server for real-time F&I sessions
  setupWebSocketServer(server);

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Keep-alive tuning for better connection reuse
  server.keepAliveTimeout = 65000;  // Slightly above typical proxy timeout (60s)
  server.headersTimeout = 66000;    // Must be > keepAliveTimeout

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
    // Force exit after 10s if graceful shutdown stalls
    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch(console.error);
