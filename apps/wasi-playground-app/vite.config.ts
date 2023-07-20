import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  server: {
    port: 51_874,
  },
  define: {
    global: "globalThis",
    process: {
      env: {},
      browser: true,
    },
  },
  resolve: {
    alias: {
      buffer: "buffer/",
    },
  },
});
