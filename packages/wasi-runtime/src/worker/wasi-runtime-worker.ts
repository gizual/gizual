import * as wasmer from "@wasmer/wasi";
import { lowerI64Imports } from "@wasmer/wasm-transformer";
import * as Asyncify from "@xtuc/asyncify-wasm";

import { WasiRunOpts, WasiRuntimeOpts } from "../common";

import { debugWrapImports } from "./debug";
import { AsyncFS } from "./fs";

let hasBeenInitialized = false;

export class WasiRuntimeWorker {
  private memFS!: wasmer.MemFS;
  private asyncFS!: AsyncFS;
  private module!: WebAssembly.Module;
  private opts!: WasiRuntimeOpts;
  private folderMappings!: Record<string, FileSystemDirectoryHandle>;
  constructor() {
    this.folderMappings = {};
  }

  addFolderMapping(path: string, handle: FileSystemDirectoryHandle) {
    this.folderMappings[path] = handle;
  }

  async init(opts: WasiRuntimeOpts): Promise<void> {
    if (!hasBeenInitialized) {
      hasBeenInitialized = true;
      await wasmer.init();
    }

    this.opts = opts;
    this.memFS = new wasmer.MemFS();

    const mappedFolders = Object.keys(this.folderMappings);

    for (const folder of mappedFolders) {
      this.memFS.createDir(folder);
    }

    this.asyncFS = new AsyncFS({
      ...this.folderMappings,
    });

    const wasmBytes = await fetch(this.opts.moduleUrl).then((res) => res.arrayBuffer());
    const loweredWasmBytes = await lowerI64Imports(new Uint8Array(wasmBytes));
    const wasmModule = await WebAssembly.compile(loweredWasmBytes);
    this.module = wasmModule;
    console.log("successfully compiled wasm module");
  }

  async run(opts: WasiRunOpts) {
    const start = performance.now();

    const { moduleName } = this.opts;
    const folderMappings = this.folderMappings;
    const { args, env } = opts;

    const preopens: Record<string, string> = {};

    for (const [key] of Object.entries(folderMappings)) {
      preopens[key] = key;
    }

    const wasi = new wasmer.WASI({
      args: [moduleName, ...args],
      fs: this.memFS,
      env,
      preopens,
    });

    this.asyncFS.setOriginalImports(wasi.getImports(this.module) as any);

    // eslint-disable-next-line no-async-promise-executor
    const runCommandPromise = new Promise<void>(async (resolve, reject) => {
      const imports = this.asyncFS.getImports();

      const instance = await Asyncify.instantiate(
        this.module,
        debugWrapImports({
          ...imports,
          feedback: {
            finished: () => resolve(),
          },
        }) as any
      );

      this.asyncFS.setMemory(instance.exports.memory as any);

      try {
        console.log("starting WASI...");

        wasi.start(instance);
      } catch (error) {
        console.error("error running WASI module", error);
        reject(error);
      }
    });

    await runCommandPromise;

    const end = performance.now();
    const durationSeconds = (end - start) / 1000;
    console.log(`Ran command in ${Math.round(durationSeconds * 1000) / 1000} seconds`);
    return this.asyncFS.getStdout();
  }
}
