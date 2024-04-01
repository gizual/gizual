import "@giz/logging/browser";

import { PoolController, PoolControllerOpts, PoolPortal } from "@giz/explorer-web";
import { downloadRepo } from "@giz/maestro/clone";
import { clearDirectory } from "@giz/opfs";

await new Promise<void>((resolve) => setTimeout(resolve, 1000));

const USE_ZIP = false;

await clearDirectory(await navigator.storage.getDirectory());
async function getPoolOpts() {
  const opts: PoolControllerOpts = {
    maxConcurrency: 1,
  };

  if (USE_ZIP) {
    const req = await fetch("/vite-git.zip");
    const buffer = await req.arrayBuffer();
    opts.zipFile = new Uint8Array(buffer);
  } else {
    const repo = await downloadRepo({
      service: "github",
      repoName: "vitejs/vite",
      onProgress: (_progress) => {},
    });
    opts.directoryHandle = repo;
  }
  return opts;
}

const opts = await getPoolOpts();

const controller = await PoolController.create(opts);

controller.on("metrics-update", (metrics) => {
  console.log(metrics);
});

const port = await controller.createPort();
const portal = new PoolPortal(port);
/*
const startTime = performance.now();
const result = await portal.getGitGraph();
const endTime = performance.now();

console.log("Git graph took", endTime - startTime, "ms");

document.body.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
*/

const startTime = performance.now();
console.log("Starting blame");
const jobRef = portal.getBlame(
  {
    path: "package.json",
    rev: "main",
    preview: false,
  },
  10,
);

console.log(jobRef);

const blame = await jobRef.promise;

const endTime = performance.now();
console.log("Blame took", endTime - startTime, "ms");

document.body.innerHTML = `<pre>${JSON.stringify(blame, undefined, 2)}</pre>`;
