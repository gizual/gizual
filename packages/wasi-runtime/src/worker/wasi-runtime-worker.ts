import { createLogger } from "@giz/logging";
import { Fd, FsaFS, WASI, ZipFS } from "@giz/wasi-shim";
import { WasiRunOpts, WasiRuntimeOpts } from "../common";

export class WasiRuntimeWorker {
  private module!: WebAssembly.Module;
  private wasi!: WASI;
  private opts!: WasiRuntimeOpts;
  private folderMappings!: Record<string, FileSystemDirectoryHandle | Uint8Array>;
  private logger = createLogger();
  constructor() {
    this.folderMappings = {};
  }

  addFolderMapping(path: string, handle: FileSystemDirectoryHandle | Uint8Array) {
    this.folderMappings[path] = handle;
  }

  async init(opts: WasiRuntimeOpts, wasmBytes: Uint8Array): Promise<void> {
    const wasmModule = await WebAssembly.compile(wasmBytes);
    this.module = wasmModule;
    this.logger.info("successfully compiled wasm module");
  }

  async run(opts: WasiRunOpts) {
    const start = performance.now();

    const { args, awaitExit } = opts;

    const fds: Fd[] = [];

    for (const [path, handle] of Object.entries(this.folderMappings)) {
      if (handle instanceof Uint8Array) {
        const folder = new ZipFS(path, handle);
        fds.push(folder);
        continue;
      }

      fds.push(await FsaFS.fromDirectoryHandle(path, handle, [".git"]));
    }

    this.wasi = await WASI.create(this.module, {
      // no support for env vars yet
      args,
      fs: fds,
      trace: false,
    });

    const runPromise = this.wasi.run();

    if (awaitExit) {
      await runPromise;
      const end = performance.now();
      const durationSeconds = (end - start) / 1000;
      this.logger.info(`Ran command in ${Math.round(durationSeconds * 1000) / 1000} seconds`);
    }

    return;
  }

  private previousReader?: Promise<any>;

  async readLine() {
    if (this.previousReader) {
      await this.previousReader;
    }

    if (!this.wasi) {
      return "";
    }

    const prom = this.wasi.readStdoutLine();
    this.previousReader = prom;
    return prom;
  }

  async writeStdin(input: string) {
    return this.wasi.writeStdin(input);
  }
}
