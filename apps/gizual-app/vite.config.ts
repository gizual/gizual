import * as child from "node:child_process";
import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import sassDts from "vite-plugin-sass-dts";
import svgr from "vite-plugin-svgr";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

const commitHash = child.execSync("git rev-parse --short HEAD").toString();

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: "./",
  build: {
    rollupOptions: {
      logLevel: process.platform === "win32" ? "silent" : "warn",
    },
  },
  optimizeDeps: {
    include: ["@xtuc/asyncify-wasm", "zod", "eventemitter3", "tslog", "lodash/flatten"],
    exclude: [
      "@sqlite.org/sqlite-wasm",
      "@tanstack/react-query",
      "@trpc/react-query",
      "@trpc/client",
      "@trpc/server",
    ],
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  resolve: {
    alias: {
      "@/mixins": path.join(__dirname, "/src/mixins.scss"),
      "@/shared": path.join(__dirname, "/src/primitives/css/shared-styles.module.scss"),

      /**
       * Polyfill for node fs module since we use ejs in the browser
       * and the maintainer does not want to support browser usage.
       * See https://github.com/mde/ejs/issues/653
       */
      fs: path.join(__dirname, "/fs-polyfill.js"),
    },
  },
  plugins: [
    {
      name: "isolation",
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          next();
        });
      },
    },
    svgr({
      include: [/\.svg$/],
    }),
    react({
      tsDecorators: true,
    }),
    wasm(),
    topLevelAwait(),
    sassDts({
      enabledMode: ["development", "production"],
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5172",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
}));
