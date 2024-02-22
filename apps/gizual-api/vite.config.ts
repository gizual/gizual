import fs from "node:fs";
import swc from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

const outDir = "./dist";

export default defineConfig(({ command, mode }) => ({
  build: {
    ssr: "./src/main.ts",
    outDir,
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
    {
      name: "after-build",
      closeBundle() {
        if (command !== "build") return;
        const packageJson = JSON.parse(
          fs.readFileSync(path.join(__dirname, "package.json"), "utf-8"),
        );

        const distPackageJson = {
          name: packageJson.name,
          version: packageJson.version || "0.0.0",
          main: "main.js",
          dependencies: packageJson.dependencies,
        };

        fs.writeFileSync(
          path.join(outDir, "package.json"),
          JSON.stringify(distPackageJson, null, 2),
        );
      },
    },
  ],
}));
