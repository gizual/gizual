import * as Comlink from "comlink";
import { createWorker } from "./create-worker";
import type { WasiRuntimeWorker } from "../worker/wasi-runtime-worker";
import { WasiRunOpts, WasiRuntimeOpts } from "../common";

export type ExtendedWasiRuntimeOpts = {
  folderMappings: Record<string, FileSystemDirectoryHandle>;
} & WasiRuntimeOpts;

export class WasiRuntime {
  private constructor(
    private opts: ExtendedWasiRuntimeOpts,
    private worker: Comlink.Remote<WasiRuntimeWorker>
  ) {}

  async init() {
    for (const [key, value] of Object.entries(this.opts.folderMappings)) {
      console.log("add folder mapping", key, value);
      await this.worker.addFolderMapping(key, value);
    }
    console.log("init");

    await this.worker.init({
      moduleUrl: this.opts.moduleUrl,
      moduleName: this.opts.moduleName,
    });
  }

  async run(opts: WasiRunOpts) {
    return await this.worker.run(opts);
  }

  static async create(opts: ExtendedWasiRuntimeOpts) {
    const worker = await createWorker();
    const runtime = new WasiRuntime(opts, worker);
    await runtime.init();
    return runtime;
  }
}
