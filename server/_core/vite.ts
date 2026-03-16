import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    // Pass the HTTP server so Vite can attach its HMR WebSocket to the same
    // server process (port 3000). The clientPort/protocol settings from
    // vite.config.ts tell the *browser* to connect via the reverse proxy
    // (port 443 / wss) rather than trying to reach the internal port directly.
    hmr: {
      server,
      clientPort: 443,
      protocol: "wss",
    },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Hashed assets (JS/CSS) get immutable cache (1 year)
  app.use("/assets", express.static(path.resolve(distPath, "assets"), {
    maxAge: "365d",
    immutable: true,
    etag: false,
  }));

  // Other static files get short cache with revalidation
  app.use(express.static(distPath, {
    maxAge: "1h",
    etag: true,
  }));

  // fall through to index.html if the file doesn't exist (no-cache for SPA shell)
  app.use("*", (_req, res) => {
    res.set("Cache-Control", "no-cache, must-revalidate");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
