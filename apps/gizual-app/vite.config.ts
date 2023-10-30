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
export default defineConfig({
  optimizeDeps: {
    include: ["@xtuc/asyncify-wasm"],
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  resolve: {
    alias: {
      "@/mixins": path.join(__dirname, "/src/mixins.scss"),
      "@/shared": path.join(__dirname, "/src/primitives/css/shared-styles.module.scss"),
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
    svgr(),
    react({
      tsDecorators: true,
    }),
    wasm(),
    topLevelAwait(),
    sassDts({
      enabledMode: ["development", "production"],
    }),
  ],
});
