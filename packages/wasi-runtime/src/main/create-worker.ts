import * as Comlink from "comlink";

import type { WasiRuntimeWorker } from "../worker/wasi-runtime-worker";

export async function createWorker() {
  const worker = new Worker(new URL("./wasi-runtime-worker.mjs", import.meta.url), { type: "module" });

  return Comlink.wrap<WasiRuntimeWorker>(worker);
}
