import * as Comlink from "comlink";

import type { WasiRuntimeWorker } from "../worker/wasi-runtime-worker";

export async function createWorker(): Promise<[Comlink.Remote<WasiRuntimeWorker>, () => void]> {
  const worker = new Worker(new URL("wasi-runtime-worker.mjs", import.meta.url), {
    type: "module",
  });

  return [Comlink.wrap<WasiRuntimeWorker>(worker), () => worker.terminate()];
}
