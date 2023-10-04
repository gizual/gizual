import { LOG } from "@giz/logger";
import { Fd, FsaFS, WASI } from "@giz/wasi-shim";
import { WasiRunOpts, WasiRuntimeOpts } from "../common";

export class WasiRuntimeWorker {
  private module!: WebAssembly.Module;
  private wasi!: WASI;
  private opts!: WasiRuntimeOpts;
  private folderMappings!: Record<string, FileSystemDirectoryHandle>;
  private id = 0;
  private logger = LOG.getSubLogger({ name: "WasiRuntimeWorker" });
  constructor() {
    this.folderMappings = {};
  }

  setId(id: number, minLevel = 0) {
    this.id = id;
    this.logger.settings.name = `WasiRuntimeWorker-${id}`;
    this.logger.settings.minLevel = minLevel;
  }

  addFolderMapping(path: string, handle: FileSystemDirectoryHandle) {
    this.folderMappings[path] = handle;
  }

  async init(opts: WasiRuntimeOpts, wasmBytes: Uint8Array): Promise<void> {
    const wasmModule = await WebAssembly.compile(wasmBytes);
    this.module = wasmModule;
    this.logger.info("successfully compiled wasm module");
  }

  async run(opts: WasiRunOpts) {
    const start = performance.now();

    const { args } = opts;

    const fds: Fd[] = [];

    for (const [path, handle] of Object.entries(this.folderMappings)) {
      fds.push(await FsaFS.fromDirectoryHandle(path, handle));
    }

    this.wasi = await WASI.create(this.module, {
      // no support for env vars yet
      args,
      fs: fds,
      trace: false,
    });

    await this.wasi.run();

    const end = performance.now();
    const durationSeconds = (end - start) / 1000;
    this.logger.info(`Ran command in ${Math.round(durationSeconds * 1000) / 1000} seconds`);
    return;
  }

  private previousReader?: Promise<any>;

  async readLine() {
    if (this.previousReader) {
      await this.previousReader;
    }
    const prom = this.wasi.readStdoutLine();
    this.previousReader = prom;
    return prom;
  }

  async writeStdin(input: string) {
    return this.wasi.writeStdin(input);
  }
}
