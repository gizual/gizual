import { expose } from "comlink";

import { WasiRuntimeWorker } from "./wasi-runtime-worker";

expose(new WasiRuntimeWorker());
