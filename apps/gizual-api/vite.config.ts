import swc from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "./src/main.production.ts",
    outDir: "./dist",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    // This is required to build the test files with SWC
    swc({
      tsDecorators: true,
    }),
  ],
});
