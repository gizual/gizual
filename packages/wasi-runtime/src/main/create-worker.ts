import * as Comlink from "comlink";

import { GizWorker } from "@giz/worker";
import type { WasiRuntimeWorker } from "../worker/wasi-runtime-worker";

export async function createWorker(
  id: number,
): Promise<[Comlink.Remote<WasiRuntimeWorker>, () => void]> {
  const worker = new GizWorker(new URL("wasi-runtime-worker.mjs", import.meta.url), {
    type: "module",
    name: `wasi-runtime-worker-${id}`,
  });

  return [Comlink.wrap<WasiRuntimeWorker>(worker), () => worker.terminate()];
}
