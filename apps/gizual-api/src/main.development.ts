import express from "express";
import path from "path";
import { ViteDevServer, createServer as createViteServer } from "vite";

let LOADED_APP: express.Router | undefined = undefined;

async function loadServerModule(vite: ViteDevServer) {
  const { createApp } = (await vite.ssrLoadModule(
    path.join(__dirname, "gizual-api.ts"),
  )) as typeof import("./gizual-api");

  LOADED_APP = createApp();
}

async function getRouter(vite: ViteDevServer) {
  if (!LOADED_APP) {
    await loadServerModule(vite);
  }
  if (!LOADED_APP) {
    throw new Error("Failed to load router");
  }
  return LOADED_APP;
}

async function main() {
  const app = express();
  // auto reload in dev mode
  const vite = await createViteServer({
    clearScreen: false,
    root: path.join(__dirname),
    configFile: path.join(__dirname, "..", "vite.config.ts"),
    appType: "custom",
    server: {
      middlewareMode: true,
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  });

  loadServerModule(vite);

  vite.watcher.on("change", () => {
    LOADED_APP = undefined;
    loadServerModule(vite);
  });

  app.use(async (req, resp) => {
    req.url = req.originalUrl;
    const handle = await getRouter(vite);
    handle(req, resp, (error) => {
      if (error) {
        vite.ssrFixStacktrace(error);
        console.error(error.stack);
        resp.status(500).end(error.stack);
      } else {
        resp.status(404).end();
      }
    });
  });
  app.listen(5172, () => {
    console.log("Dev-Server running at http://localhost:5172");
  });
}

main();
