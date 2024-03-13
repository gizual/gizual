import * as Comlink from "comlink";

import { GizWorker } from "@giz/worker";
import WasiRuntimeWorkerUrl from "../worker/index?worker&url";
import type { WasiRuntimeWorker } from "../worker/wasi-runtime-worker";

export async function createWorker(
  id: number,
): Promise<[Comlink.Remote<WasiRuntimeWorker>, () => void]> {
  const worker = new GizWorker(WasiRuntimeWorkerUrl, {
    type: "module",
    name: `wasi-runtime-worker-${id}`,
  });

  return [Comlink.wrap<WasiRuntimeWorker>(worker), () => worker.terminate()];
}
