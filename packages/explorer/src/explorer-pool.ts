import wasmFileUrl from "@giz/explorer-backend-libgit2/dist/explorer-backend-libgit2.wasm?url";
import { LOG, Logger } from "@giz/logger";
import { WasiRuntime } from "@giz/wasi-runtime";

import { Blame, FileTree, isBlame, isFileTree } from "./types";

const SKIP_VALIDATION = true;
const MAX_WORKERS = 3;

type WorkerWithState = {
  busy: boolean;
  handle: WasiRuntime;
};

type Job = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  method: string;
  params?: any[];
};

async function createWorker(handle: FileSystemDirectoryHandle) {
  const runtime = await WasiRuntime.create({
    moduleUrl: wasmFileUrl,
    moduleName: "/module.wasm",
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

  return runtime;
}

export class ExplorerPool {
  private workers: WorkerWithState[];
  private jobQueue: any[];
  private counter = 0;
  logger: Logger;

  constructor(workers: WorkerWithState[]) {
    this.workers = workers;
    this.jobQueue = [];
    this.logger = LOG.getSubLogger({ name: "Explorer" });
  }

  static async create(handle: FileSystemDirectoryHandle, numWorkers: number = MAX_WORKERS) {
    const workerPromises: Promise<WasiRuntime>[] = [];

    for (let i = 0; i < numWorkers; i++) {
      workerPromises.push(createWorker(handle));
    }
    const workers = await Promise.all(workerPromises);

    const pool = workers.map((w) => ({ handle: w, busy: false }));

    return new ExplorerPool(pool);
  }

  execute(method: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.enqueueJob({
        resolve,
        reject,
        method,
        params,
      });
    });
  }

  enqueueJob(job: Job) {
    this.jobQueue.push(job);
    this.dispatchJob();
  }

  private async executeOnWorker(worker: WorkerWithState, job: Job): Promise<any> {
    const { method, params } = job;

    const payload = {
      jsonrpc: "2.0",
      id: this.counter++,
      method,
      params,
    };

    this.logger.trace("running cmd", payload);
    const payloadString = JSON.stringify(payload) + "\n";
    worker.handle.writeStdin(payloadString);

    const stdout = await worker.handle.readStdout();
    const data = JSON.parse(stdout);
    //this.logger.trace("result", data);

    if (data.error) {
      job.reject(new Error(data.error.message));
    } else {
      job.resolve(data.result);
    }
    worker.busy = false;
    this.dispatchJob();
  }

  private dispatchJob() {
    if (this.jobQueue.length === 0) {
      return;
    }
    const job = this.jobQueue.shift();
    const worker = this.getAvailableWorker();

    if (worker) {
      worker.busy = true;
      this.executeOnWorker(worker, job);
    } else {
      this.jobQueue.unshift(job);
    }
  }

  private getAvailableWorker(): WorkerWithState | undefined {
    return this.workers.find((worker) => !worker.busy);
  }

  // -------

  async getBranches(): Promise<string[]> {
    const output = await this.execute("list_branches");

    if (
      SKIP_VALIDATION ||
      (Array.isArray(output) && output.every((branch) => typeof branch === "string"))
    ) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getBlame(branch: string, path: string): Promise<Blame> {
    const output = await this.execute("blame", [{ branch, path }]);

    if (SKIP_VALIDATION || isBlame(output)) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getFileContent(branch: string, path: string): Promise<string> {
    return this.execute("file_content", [{ branch, path }]);
  }

  async getFileTree(branch: string): Promise<FileTree> {
    const output = await this.execute("file_tree", [{ branch }]);

    if (SKIP_VALIDATION || isFileTree(output)) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getGitGraph() {
    return this.execute("git_graph");
  }
}
