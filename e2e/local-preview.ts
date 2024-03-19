import express from "express";
import path from "node:path";
import { createProxyMiddleware } from "http-proxy-middleware";

const rootPath = path.join(process.cwd(), "..");
const builtAppDir = path.join(rootPath, "apps/gizual-app/dist");

const app = express();

app.use((_req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

app.use(
  "/api",
  createProxyMiddleware({
    target: "http://localhost:5172",
    changeOrigin: true,
    pathRewrite: (path) => path.replace(/^\/api/, ""),
  }),
);

app.use(express.static(builtAppDir));

app.listen(4173, () => {
  console.log("E2E Listening on http://localhost:4173");
});
