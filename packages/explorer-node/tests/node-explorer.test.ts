import { execSync } from "node:child_process";
import { expect, test } from "vitest";

import { ExplorerPool } from "../ts-src/explorer-pool";

const rootRepoPath = execSync("git rev-parse --show-toplevel").toString().trim();

test(
  "can explore current repo",
  async () => {
    const pool = new ExplorerPool();

    let numCalls = 0;
    await new Promise<void>((resolve) => {
      pool.request("open_repository", { path: rootRepoPath }, (response) => {
        numCalls++;
        expect(response).toMatchObject({ data: { success: true } });
        resolve();
      });
    });

    expect(numCalls).toBe(1);
  },
  {
    timeout: 1000,
  },
);

test(
  "can get initial data",
  async () => {
    const pool = new ExplorerPool();

    let numCalls = 0;
    await new Promise<void>((resolve) => {
      pool.request("open_repository", { path: rootRepoPath }, (response) => {
        numCalls++;
        expect(response).toMatchObject({ data: { success: true } });
        resolve();
      });
    });

    expect(numCalls).toBe(1);

    await new Promise<void>((resolve) => {
      pool.request("get_initial_data", {}, (response) => {
        numCalls++;
        console.dir(response, { depth: 99 });
        resolve();
      });
    });

    expect(numCalls).toBe(2);
  },
  {
    timeout: 1000,
  },
);
