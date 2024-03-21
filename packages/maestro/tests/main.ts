/* eslint-disable no-console */
import { PoolNode } from "@giz/explorer/src/pool/pool-node";
import wasmFileUrl from "@giz/explorer-libgit2/dist/explorer-libgit2.wasm?url";

console.log(wasmFileUrl);

const node = new PoolNode({
  wasmFileUrl: `file://${wasmFileUrl}`,
});

const zipPath = "/Volumes/Projects/gizual/diamond/.git.zip";

const zipData = new Uint8Array(await Bun.file(zipPath).arrayBuffer());

node.boot(zipData);

await node.starting;

const startTime = performance.now();
const prom = new Promise<void>((resolve) => {
  node.execute({
    id: 1,
    priority: 1,
    origin: {
      postMessage: (data) => {
        // const str = JSON.stringify(data.data);
        // console.log(str);

        // measure bytes sent

        if (data.end) {
          resolve();
        }
      },
    },
    method: "file_tree",
    params: [{ branch: "main" }],
  });
});

await prom;

const endTime = performance.now();

console.log("Time taken in ms:", endTime - startTime);

node.dispose();
