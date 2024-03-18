import fs from "node:fs/promises";
import path from "node:path";
import { exit } from "node:process";
import { BrowserContext } from "@playwright/test";
import { PageModel } from "e2e/src/page-model";
import { chromium, firefox } from "playwright";
import waitPort from "wait-port";

const HEADLESS = true;
const NUM_CYCLES = 3;

const BROWSERS = [
  {
    name: "chrome",
    browser: chromium,
  },
  {
    name: "firefox",
    browser: firefox,
  },
] as const;

const SERVER = {
  protocol: "http",
  host: "localhost",
  port: 4173,
};

const REPO_TO_CLONE = "https://github.com/gizual/testcase--ts-rest";

/**
 * This basic benchmark launches a browser (chrome, firefox), navigates to a page,
 * opens a repo from a URL, and waits for the workers to be idle.
 *
 * aka.: Benchmarking time to first meaningful visualization
 */
async function main() {
  const { open } = await waitPort({
    host: SERVER.host,
    port: SERVER.port,
    output: "dots",
    timeout: 5 * 1000,
  });

  if (!open) {
    console.error(`Server is not running at ${SERVER.protocol}://${SERVER.host}:${SERVER.port}`);
    exit(1);
  }

  const results: Record<string, number[]> = {};

  for (const { name, browser } of BROWSERS) {
    results[name] = [];
    const profilePath = path.resolve(path.join(".cache", name));

    // clear profile folder
    await fs.rm(profilePath, { recursive: true });

    const browserContext: BrowserContext = await browser.launchPersistentContext(profilePath, {
      headless: HEADLESS,
    });

    // warmup
    console.log(`Warming up ${name}`);
    await runCycle(browserContext);

    for (let i = 0; i < NUM_CYCLES; i++) {
      console.log(`Running cycle ${i + 1} for ${name}`);
      const startTimeMs = performance.now();
      await runCycle(browserContext);
      const endTimeMs = performance.now();

      const timeMs = endTimeMs - startTimeMs;
      const timeS = timeMs / 1000;
      console.log(`cycle ${i + 1} for ${name} took ${timeS.toFixed(2)} seconds`);
      results[name].push(timeMs);
    }
  }

  const average: Record<string, number> = {};

  for (const { name } of BROWSERS) {
    const times = results[name];
    const sum = times.reduce((acc, time) => acc + time, 0);
    average[name] = sum / times.length;
  }

  const [fastest] = Object.entries(average).sort(([, a], [, b]) => a - b)[0];

  console.log("-".repeat(80));

  const fastestTimeMs = average[fastest];
  const fastestTimeS = fastestTimeMs / 1000;
  console.log(`Fastest: ${fastest}, ${fastestTimeS.toFixed(2)}s on average.`);

  for (const { name } of BROWSERS) {
    if (name === fastest) continue;
    const averageS = average[name] / 1000;
    const diffMs = Math.abs(average[fastest] - average[name]);
    const diffS = diffMs / 1000;
    const percent = (diffMs / average[fastest]) * 100;

    const averageStr = averageS.toFixed(2);
    const diffStr = diffS.toFixed(2);
    const percentStr = percent.toFixed(2);
    console.log(`${name} took ${averageStr}s, that is ${diffStr}s slower (${percentStr}%)`);
  }

  exit(0);
}

const url = `${SERVER.protocol}://${SERVER.host}:${SERVER.port}`;

async function runCycle(browser: BrowserContext) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout"));
    }, 30 * 1000);

    _runCycle(browser)
      .then(() => {
        clearTimeout(timer);
        resolve();
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function _runCycle(browser: BrowserContext) {
  const page = await browser.newPage();

  await page.goto(url);

  const model = new PageModel(page);

  await model.waitForPageReady();

  await Promise.all([model.waitForWorkersIdle(), model.openRepoFromURL(REPO_TO_CLONE)]);

  await page.close();
}

await main();
