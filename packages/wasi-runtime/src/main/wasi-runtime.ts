import * as Comlink from "comlink";

import { createLogger, Logger } from "@giz/logging";
import { WasiRunOpts, WasiRuntimeOpts } from "../common";
import type { WasiRuntimeWorker } from "../worker/wasi-runtime-worker";

import { createWorker } from "./create-worker";

export type ExtendedWasiRuntimeOpts = {
  folderMappings: Record<string, FileSystemDirectoryHandle | Uint8Array>;
} & WasiRuntimeOpts;

const WASM_CACHE: Record<string, Uint8Array> = {};

export class WasiRuntime {
  private id = 0;
  logger: Logger;
  private constructor(
    private opts: ExtendedWasiRuntimeOpts,
    private worker: Comlink.Remote<WasiRuntimeWorker>,
    private terminate: () => void,
  ) {
    this.id = opts.id ?? 0;
    this.logger = createLogger(`wasi-runtime-${this.id}`);
  }

  async init() {
    for (const [key, value] of Object.entries(this.opts.folderMappings)) {
      if (value instanceof Uint8Array) {
        const zipCopy = new Uint8Array(value);
        await this.worker.addFolderMapping(key, Comlink.transfer(zipCopy, [zipCopy.buffer]));
      } else {
        await this.worker.addFolderMapping(key, value);
      }
    }

    let bytes: Uint8Array;
    if (WASM_CACHE[this.opts.moduleUrl]) {
      bytes = new Uint8Array(WASM_CACHE[this.opts.moduleUrl]);
    } else {
      const wasmBytes = await fetch(this.opts.moduleUrl).then((res) => res.arrayBuffer());
      bytes = new Uint8Array(wasmBytes);
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
    const [worker, terminate] = await createWorker(opts.id ?? 0);

    const runtime = new WasiRuntime(opts, worker, terminate);
    await runtime.init();
    return runtime;
  }
}
