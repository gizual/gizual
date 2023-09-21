import { lowerI64Imports } from "@wasmer/wasm-transformer";
import * as Comlink from "comlink";

import { LOG, Logger } from "@giz/logger";
import { WasiRunOpts, WasiRuntimeOpts } from "../common";
import type { WasiRuntimeWorker } from "../worker/wasi-runtime-worker";

import { createWorker } from "./create-worker";

export type ExtendedWasiRuntimeOpts = {
  folderMappings: Record<string, FileSystemDirectoryHandle>;
} & WasiRuntimeOpts;

let COUNTER = 0;

const WASM_CACHE: Record<string, Uint8Array> = {};

export class WasiRuntime {
  id = 0;
  logger: Logger;
  private constructor(
    private opts: ExtendedWasiRuntimeOpts,
    private worker: Comlink.Remote<WasiRuntimeWorker>,
    private terminate: () => void,
  ) {
    this.id = COUNTER++;
    this.logger = LOG.getSubLogger({ name: `WasiRuntime-${this.id}` });
    worker.setId(this.id, this.logger.settings.minLevel);
  }

  async init() {
    for (const [key, value] of Object.entries(this.opts.folderMappings)) {
      this.logger.trace("add folder mapping", key, value);
      await this.worker.addFolderMapping(key, value);
    }
    console.log("init");

    let bytes: Uint8Array;
    if (WASM_CACHE[this.opts.moduleUrl]) {
      bytes = new Uint8Array(WASM_CACHE[this.opts.moduleUrl]);
    } else {
      const wasmBytes = await fetch(this.opts.moduleUrl).then((res) => res.arrayBuffer());
      bytes = await lowerI64Imports(new Uint8Array(wasmBytes));
      WASM_CACHE[this.opts.moduleUrl] = new Uint8Array(bytes);
    }

    await this.worker.init(
      {
        moduleUrl: this.opts.moduleUrl,
        moduleName: this.opts.moduleName,
      },
      Comlink.transfer(bytes, [bytes.buffer]),
    );
  }

  async run(opts: WasiRunOpts) {
    return await this.worker.run(opts);
  }

  readStdout() {
    return this.worker.readLine();
  }

  writeStdin(input: string) {
    return this.worker.writeStdin(input);
  }

  dispose() {
    this.terminate();
  }

  static async create(opts: ExtendedWasiRuntimeOpts) {
    const [worker, terminate] = await createWorker();

    const runtime = new WasiRuntime(opts, worker, terminate);
    await runtime.init();
    return runtime;
  }
}
