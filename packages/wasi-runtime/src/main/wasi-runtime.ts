import * as Comlink from "comlink";

import { LOG, Logger } from "@giz/logger";
import { WasiRunOpts, WasiRuntimeOpts } from "../common";
import type { WasiRuntimeWorker } from "../worker/wasi-runtime-worker";

import { createWorker } from "./create-worker";

export type ExtendedWasiRuntimeOpts = {
  folderMappings: Record<string, FileSystemDirectoryHandle>;
} & WasiRuntimeOpts;

let COUNTER = 0;
export class WasiRuntime {
  id = 0;
  logger: Logger;
  private constructor(
    private opts: ExtendedWasiRuntimeOpts,
    private worker: Comlink.Remote<WasiRuntimeWorker>
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

    await this.worker.init({
      moduleUrl: this.opts.moduleUrl,
      moduleName: this.opts.moduleName,
    });
    (<any>window).W = this.worker;
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

  static async create(opts: ExtendedWasiRuntimeOpts) {
    const worker = await createWorker();

    const runtime = new WasiRuntime(opts, worker);
    await runtime.init();
    return runtime;
  }
}
