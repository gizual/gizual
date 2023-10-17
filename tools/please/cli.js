#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const buildToolsDir = path.resolve(__dirname);

const entry = path.join(buildToolsDir, "src", "main.ts");
const args = [entry, "--", ...process.argv.slice(2)];

const rootNodeModulesDir = path.join(buildToolsDir, "..", "..", "node_modules");

const viteNodePath = path.join(rootNodeModulesDir, ".bin", "vite-node");

const extension = process.platform === "win32" ? ".cmd" : "";

spawnSync(`${viteNodePath}${extension}`, args, { stdio: "inherit" });
