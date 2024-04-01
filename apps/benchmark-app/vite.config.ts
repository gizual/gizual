import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import wasm from "vite-plugin-wasm";

const target = ["chrome106", "edge106", "firefox110", "safari16", "es2022"];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  mode,
  base: "./",
  esbuild: {
    target,
  },
  build: {
    target,
    rollupOptions: {
      logLevel: process.platform === "win32" ? "silent" : "warn",
    },
  },
  optimizeDeps: {
    // include: ["buffer/", "@xtuc/asyncify-wasm", "zod", "eventemitter3", "fflate/browser", "ejs"],
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
  resolve: {
    alias: {
      /**
       * Polyfill for node fs module since we use ejs in the browser
       * and the maintainer does not want to support browser usage.
       * See https://github.com/mde/ejs/issues/653
       */
      fs: path.join(__dirname, "../gizual-app/fs-polyfill.js"),
    },
  },
  plugins: [
    svgr({
      include: [/\.svg$/],
    }),
    react({
      tsDecorators: true,
    }),
    wasm(),
  ],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      "/api": {
        target: "http://localhost:5172",
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
}));
