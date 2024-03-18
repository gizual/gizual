import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

import path from "node:path";

const rootPath = path.resolve(__dirname, "..");
const cwd = process.cwd();

const builtApiDir = path.join(rootPath, "apps/gizual-api/dist");
const builtAppDir = path.join(rootPath, "apps/gizual-app/dist");

if (!fs.existsSync(builtApiDir) || !fs.readdirSync(builtApiDir).length) {
  throw new Error("API is not built");
}

if (!fs.existsSync(builtAppDir) || !fs.readdirSync(builtAppDir).length) {
  throw new Error("App is not built");
}

export default defineConfig({
  outputDir: path.join(cwd, "dist/test-results"),

  testDir: "src",
  testMatch: "**/*.e2e.ts",

  fullyParallel: true,
  workers: process.env.CI ? 1 : 3,
  retries: process.env.CI ? 1 : 0,

  forbidOnly: !!process.env.CI,
  reporter: [
    ["html", { outputFolder: "dist/reports", open: process.env.CI ? "never" : "on-failure" }],
  ],
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
    video: "on-first-retry",
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome HiDPI"], colorScheme: "dark" },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox HiDPI"] },
    },
  ],
  webServer: [
    {
      // API
      command: "node main.js",
      reuseExistingServer: !process.env.CI,
      cwd: builtApiDir,
      port: 5172,
    },
    {
      // APP
      command: "yarn start-app",
      port: 4173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
