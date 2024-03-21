import * as child from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import sassDts from "vite-plugin-sass-dts";
import svgr from "vite-plugin-svgr";
import wasm from "vite-plugin-wasm";

const commitHash = child.execSync("git rev-parse --short HEAD").toString();
const rootDir = child.execSync("git rev-parse --show-toplevel").toString().trim();

const packageJson = await fsp.readFile(path.join(rootDir, "package.json"), "utf8").then(JSON.parse);

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
    include: [
      "buffer/",
      "@xtuc/asyncify-wasm",
      "zod",
      "eventemitter3",
      "lodash/flatten",
      "fflate/browser",
      "ejs",
    ],
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
  define: {
    "import.meta.env.COMMIT_HASH": JSON.stringify(commitHash),
    "import.meta.env.VERSION": JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      "@/mixins": path.join(__dirname, "/src/mixins.scss"),
      "@/colors": path.join(__dirname, "/src/colors.scss"),
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
    svgr({
      include: [/\.svg$/],
    }),
    react({
      tsDecorators: true,
    }),
    wasm(),
    sassDts({
      enabledMode: ["development", "production"],
    }),
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
        rewrite: (path) => path.replace(/^\/api/, ""),
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
