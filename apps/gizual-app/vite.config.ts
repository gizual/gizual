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
