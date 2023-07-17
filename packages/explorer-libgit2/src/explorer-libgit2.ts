import wasmFileUrl from "@giz/explorer-backend-libgit2/dist/explorer-backend-libgit2.wasm?url";
import { WasiRuntime } from "@giz/wasi-runtime";

import { Blame, FileTree, isBlame, isFileTree } from "./types";
import { LOG, Logger } from "@giz/logger";
const wasmFilePath = "/wasi-playground-module.wasm";

const SKIP_VALIDATION = true;
const MAX_WORKERS = 3;
export class ExplorerLibgit2 {
  logger: Logger;
  counter = 0;

  private workers: { worker: WasiRuntime; busy: boolean }[];

  private constructor(worker: WasiRuntime[]) {
    this.logger = LOG.getSubLogger({ name: "ExplorerLibgit2" });
    this.logger.trace("backend is ready");
    this.workers = worker.map((w) => ({ worker: w, busy: false }));
  }

  static async create(handle: FileSystemDirectoryHandle) {
    const workers: WasiRuntime[] = [];

    for (let i = 0; i < MAX_WORKERS; i++) {
      const runtime = await WasiRuntime.create({
        moduleUrl: wasmFileUrl,
        moduleName: wasmFilePath,
        folderMappings: {
          "/repo": handle,
        },
      });

      runtime.run({
        env: {},
        args: [],
      });
      const stdout = await runtime.readStdout();
      const data = JSON.parse(stdout);
      if (!data?.ready) {
        throw new Error(data.error);
      }
      workers.push(runtime);
    }

    return new ExplorerLibgit2(workers);
  }

  async runOnFreeWorker<T>(cb: (worker: WasiRuntime) => Promise<T>) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const worker = this.workers.find((w) => !w.busy);
      if (worker) {
        worker.busy = true;
        const result = await cb(worker.worker);
        worker.busy = false;
        return result;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  private queue: {
    method: string;
    params?: any[];
    resolve: (data: any) => void;
    reject: (error: any) => void;
  }[] = [];
  private workOnQueue() {
    if (this.queue.length === 0) {
      return;
    }

    const { method, params, resolve, reject } = this.queue.shift()!;

    this.runOnFreeWorker(async (worker) => {
      try {
        const result = await this.execute(worker, method, params);
        resolve(result);
      } catch (error) {
        this.logger.error(error);
        reject(error);
      } finally {
        setTimeout(() => this.workOnQueue(), 10);
      }
    });
  }

  private async execute(worker: WasiRuntime, method: string, params?: any[]): Promise<any> {
    const payload = {
      jsonrpc: "2.0",
      id: this.counter++,
      method,
      params,
    };

    this.logger.trace("running cmd", payload);
    const payloadString = JSON.stringify(payload) + "\n";
    worker.writeStdin(payloadString);

    const stdout = await worker.readStdout();
    const data = JSON.parse(stdout);
    //this.logger.trace("result", data);

    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.result;
  }

  async runRpcCommand(method: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ method, params, resolve, reject });
      this.workOnQueue();
    });
  }

  async getBranches(): Promise<string[]> {
    const output = await this.runRpcCommand("list_branches");

    if (
      SKIP_VALIDATION ||
      (Array.isArray(output) && output.every((branch) => typeof branch === "string"))
    ) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getBlame(branch: string, path: string): Promise<Blame> {
    const output = await this.runRpcCommand("blame", [{ branch, path }]);

    if (SKIP_VALIDATION || isBlame(output)) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getFileContent(branch: string, path: string): Promise<string> {
    const output = await this.runRpcCommand("file_content", [{ branch, path }]);

    return output;
  }

  async getFileTree(branch: string): Promise<FileTree> {
    const output = await this.runRpcCommand("file_tree", [{ branch }]);

    if (SKIP_VALIDATION || isFileTree(output)) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getGitGraph() {
    const output = await this.runRpcCommand("git_graph", []);
    return output;
  }
}
