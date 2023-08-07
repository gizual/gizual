import { isString } from "lodash";
import { makeObservable, observable } from "mobx";

import wasmFileUrl from "@giz/explorer-backend-libgit2/dist/explorer-backend-libgit2.wasm?url";
import { LOG, Logger } from "@giz/logger";
import { WasiRuntime } from "@giz/wasi-runtime";

import { Author, Blame, FileTreeNode, isBlame } from "./types";

const SKIP_VALIDATION = true;

type WorkerWithState = {
  busy: boolean;
  handle: WasiRuntime;
};

type CommandJob = {
  method: string;
  params?: any[];
  onErr: (err: any) => void;
  onEnd: (data: any) => void;
};

function isJob(obj: any): obj is Job {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "method" in obj &&
    typeof obj.method === "string" &&
    ("params" in obj ? Array.isArray(obj.params) : true) &&
    "onErr" in obj &&
    typeof obj.onErr === "function" &&
    "onEnd" in obj &&
    typeof obj.onEnd === "function"
  );
}

type StreamJob = {
  method: string;
  params?: any[];
  onEnd: () => void;
  onData: (data: any) => void;
  onErr: (err: any) => void;
};

function isStreamJob(obj: any): obj is StreamJob {
  return isJob(obj) && "onData" in obj && typeof obj.onData === "function";
}

type Job = CommandJob | StreamJob;

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

const MAX_CONCURRENCY = navigator.hardwareConcurrency || 4;

export class ExplorerPool {
   _workers: WorkerWithState[];
   _jobQueue: Job[];
  private counter = 0;
  logger: Logger;

  constructor(workers: WorkerWithState[]) {
    this._workers = workers;
    this._jobQueue = [];
    this.logger = LOG.getSubLogger({ name: "Explorer" });

    makeObservable(this, {
      _workers: observable,
      _jobQueue: observable,
    });
  }

  get numWorkers() {
    return this._workers.length;
  }

  get numJobsInQueue() {
    return this._jobQueue.length;
  }

  get numBusyWorkers() {
    return this._workers.filter((w) => w.busy).length;
  }

  static async create(handle: FileSystemDirectoryHandle, numWorkers: number = MAX_CONCURRENCY) {
    const workerPromises: Promise<WasiRuntime>[] = [];

    for (let i = 0; i < numWorkers; i++) {
      workerPromises.push(createWorker(handle));
    }
    const workers = await Promise.all(workerPromises);

    const pool = workers.map((w) => (observable({ handle: w, busy: false })));

    return new ExplorerPool(pool);
  }

  execute(method: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.enqueueJob({
        onEnd: resolve,
        onErr: reject,
        method,
        params,
      });
    });
  }

  executeStream(job: StreamJob): void {
    this.enqueueJob(job);
  }

  private enqueueJob(job: Job) {
    this._jobQueue.push(job);
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

    while (worker.busy) {
      const stdout = await worker.handle.readStdout();
      const data = JSON.parse(stdout);

      const isIntermediateResponse = !isString(data?.jsonrpc);
      //this.logger.trace("stdout", stdout);

      if (data.error) {
        job.onErr(new Error(data.error.message));
      }
      if (!isIntermediateResponse) {
        job.onEnd(data.result);
        break;
      } else if (isStreamJob(job) && isIntermediateResponse) {
        job.onData(data);
      } else {
        job.onErr(
          new Error(
            `Unexpected stream response: isIntermediateResponse=${isIntermediateResponse} isStreamJob=${isStreamJob}`,
          ),
        );
        break;
      }
    }
    worker.busy = false;
    this.dispatchJob();
  }

  private dispatchJob() {
    if (this._jobQueue.length === 0) {
      return;
    }
    const job = this._jobQueue.shift();

    if (!job) {
      return;
    }

    const worker = this.getAvailableWorker();

    if (worker) {
      worker.busy = true;
      this.executeOnWorker(worker, job);
    } else {
      this._jobQueue.unshift(job);
    }
  }

  private getAvailableWorker(): WorkerWithState | undefined {
    return this._workers.find((worker) => !worker.busy);
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

  async getBlame(branch: string, path: string, preview?: boolean): Promise<Blame> {
    const output = await this.execute("blame", [{ branch, path, preview }]);

    if (SKIP_VALIDATION || isBlame(output)) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getFileContent(branch: string, path: string): Promise<string> {
    return this.execute("file_content", [{ branch, path }]);
  }

  async getGitGraph() {
    return this.execute("git_graph");
  }

  async streamFileTree(
    branch: string,
    onData: (data: FileTreeNode) => void,
    onEnd: () => void,
    onErr: (err: any) => void,
  ) {
    this.executeStream({
      method: "file_tree",
      params: [{ branch }],
      onData,
      onEnd,
      onErr,
    });
  }

  async streamAuthors(
    onData: (data: Author) => void,
    onEnd: () => void,
    onErr: (err: any) => void,
  ) {
    this.executeStream({
      method: "stream_authors",
      params: [],
      onData,
      onEnd,
      onErr,
    });
  }
}
