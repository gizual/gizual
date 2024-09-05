import { isString } from "lodash";
import { action, makeObservable, observable, runInAction } from "mobx";

import wasmFileUrl from "@giz/explorer/dist/explorer-libgit2.wasm?url";
import { LOG, Logger } from "@giz/logging";
import { WasiRuntime } from "@giz/wasi-runtime";

import { Author, Blame, FileTreeNode, GetFileContentResult } from "./types";

type WorkerWithState = {
  busy: boolean;
  handle: WasiRuntime;
  activeJob?: Job;
};

type CommandJob = {
  id?: number;
  priority?: number;
  method: string;
  params?: any;
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
  id?: number;
  priority?: number;
  method: string;
  params?: any;
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

  let stdout = "";
  while (!stdout) {
    stdout = await runtime.readStdout();

    if (!stdout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const data = JSON.parse(stdout);
  if (!data?.ready) {
    throw new Error(data.error);
  }

  return runtime;
}

const MAX_CONCURRENCY = (navigator.hardwareConcurrency || 4) * 2;

//const MAX_CONCURRENCY = 1;

export class JobRef<T = any> {
  private id_: number;
  private priority_: number;
  private promise_: Promise<T>;
  constructor(
    private pool: ExplorerPool,
    job: Job,
  ) {
    this.id_ = job.id ?? this.pool.counter++;
    this.priority_ = job.priority ?? 1;

    this.promise_ = new Promise<T>((resolve, reject) => {
      const originalOnEnd = job.onEnd;
      const originalOnErr = job.onErr;

      job.onEnd = (data) => {
        originalOnEnd(data);
        resolve(data);
      };
      job.onErr = (error) => {
        originalOnErr(error);
        reject(error);
      };
    });
  }

  get priority() {
    return this.priority_;
  }

  setPriority(priority: number) {
    this.priority_ = priority;
    this.pool.setJobPriority(this.id_, priority);
    this.pool._dispatchJob();
  }

  cancel() {
    console.warn("cancel", this.id_);
    this.pool.cancelJob(this.id_);
  }

  get promise() {
    return this.promise_;
  }
}

export class ExplorerPool {
  _workers: WorkerWithState[];
  _jobQueue: Job[];
  counter = 0;
  logger: Logger;
  handle: FileSystemDirectoryHandle;

  constructor(workers: WorkerWithState[], handle: FileSystemDirectoryHandle) {
    this.handle = handle;
    this._workers = workers;
    this._jobQueue = [];
    this.logger = LOG.getSubLogger({ name: "Explorer" });

    makeObservable(this, {
      _workers: observable,
      _jobQueue: observable,
      _dispatchJob: action,
      _enqueueJob: action,
      cancelJob: action,
      addWorker: action,
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

    const pool = workers.map((w) => observable({ handle: w, busy: false }));

    return new ExplorerPool(pool, handle);
  }

  setJobPriority(id: number, priority: number) {
    const job = this._jobQueue.find((job) => job.id === id);
    if (job) {
      job.priority = priority;
    }
  }

  cancelJob(id: number) {
    const job = this._jobQueue.find((job) => job.id === id);
    if (job) {
      this._jobQueue = this._jobQueue.filter((j) => job !== j);
    } else {
      const workerIndex = this._workers.findIndex((worker) => worker.activeJob?.id === id);
      if (workerIndex > -1) {
        const worker = this._workers[workerIndex];
        worker.activeJob?.onErr(new Error("Job cancelled"));
        worker.handle.dispose();

        this._workers = this._workers.filter((w) => w !== worker);

        this.addWorker();
      } else {
        console.warn("Job not found", id);
      }
    }
  }

  addWorker() {
    createWorker(this.handle).then((w) => {
      runInAction(() => {
        this._workers.push(observable({ handle: w, busy: false }));
      });
      this._dispatchJob();
    });
  }

  execute(method: string, params?: any, priority = 100): JobRef {
    const job = {
      id: this.counter++,
      priority,
      params,
      method,
      onEnd: () => {},
      onErr: () => {},
    };

    const ref = new JobRef(this, job);

    this._enqueueJob(job);

    return ref;
  }

  executeStream(job: StreamJob) {
    return this._enqueueJob(job);
  }

  _enqueueJob(job_: Job) {
    const id = job_.id ?? this.counter++;
    const priority = job_.priority ?? 1;

    const job = {
      ...job_,
      id,
      priority,
    };

    const ref = new JobRef(this, job);
    this._jobQueue.push(job);

    this._dispatchJob();

    return ref;
  }

  private async executeOnWorker(worker: WorkerWithState, job: Job): Promise<any> {
    const { method, params, id, priority } = job;

    const payload = {
      jsonrpc: "2.0",
      id: id ?? this.counter++,
      method,
      params,
    };

    this.logger.trace("running cmd", payload, priority);
    const payloadString = JSON.stringify(payload) + "\n";
    worker.handle.writeStdin(payloadString);

    while (worker.busy) {
      const stdout = await worker.handle.readStdout();

      let data;
      try {
        data = JSON.parse(stdout);
      } catch (error) {
        job.onErr(error);
        console.error("error parsing stdout", stdout, error);
        break;
      }

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
    runInAction(() => {
      worker.busy = false;
      worker.activeJob = undefined;
    });
    this._dispatchJob();
  }

  _dispatchJob() {
    if (this._jobQueue.length === 0) {
      return;
    }

    this._jobQueue = this._jobQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const job = this._jobQueue.shift();

    if (!job) {
      return;
    }

    if (job.priority === 0) {
      this._jobQueue.push(job);
      return;
    }

    const worker = this.getAvailableWorker();

    if (worker) {
      worker.busy = true;
      worker.activeJob = job;
      this.executeOnWorker(worker, job);
    } else {
      this._jobQueue.unshift(job);
    }
  }

  private getAvailableWorker(): WorkerWithState | undefined {
    return this._workers.find((worker) => !worker.busy);
  }

  // -------

  getBranches(): Promise<string[]> {
    return this.execute("get_branches").promise;
  }

  getBlame(branch: string, path: string, preview?: boolean): JobRef<Blame> {
    return this.execute("get_blame", { branch, path, preview }, preview ? 100 : 1);
  }

  getFileContent(branch: string, path: string): Promise<GetFileContentResult> {
    return this.execute("get_file_content", { branch, path }).promise;
  }

  getGitGraph() {
    return this.execute("get_git_graph").promise;
  }

  streamFileTree(
    branch: string,
    onData: (data: FileTreeNode) => void,
    onEnd: () => void,
    onErr: (err: any) => void,
  ) {
    return this.executeStream({
      method: "stream_file_tree",
      params: { branch },
      onData,
      onEnd,
      onErr,
    });
  }

  streamAuthors(onData: (data: Author) => void, onEnd: () => void, onErr: (err: any) => void) {
    return this.executeStream({
      method: "stream_authors",
      params: {},
      onData,
      onEnd,
      onErr,
    });
  }
}
