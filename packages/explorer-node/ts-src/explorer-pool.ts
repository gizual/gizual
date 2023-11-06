import {
  Callback,
  ExplorerPoolI,
  ExplorerPoolMetrics,
  JobCanceledError,
  Methods,
  Params,
} from "@giz/explorer";

import { Explorer } from "./explorer";

export type JobReference = number;

class ExplorerWorker {
  instance: Explorer;
  activeJob?: Job<any>;

  constructor() {
    this.instance = new Explorer();
  }

  handle<M extends Methods>(job: Job<M>) {
    if (this.activeJob) {
      throw new Error("Worker is busy");
    }
    this.activeJob = job;

    this.instance.send(job.method, job.params, (resp) => {
      job.callback(resp);
      this.activeJob = undefined;
    });
  }
}

interface Job<M extends Methods> {
  id: JobReference;
  priority: number;
  method: M;
  params: Params<M>;
  callback: Callback<M>;
}

export class ExplorerPool implements ExplorerPoolI<JobReference> {
  counter: number;
  jobs: Job<any>[];

  worker: ExplorerWorker;

  constructor() {
    this.jobs = [];
    this.worker = new ExplorerWorker();
    this.counter = 0;
  }

  getNumJobs(): Promise<number> {
    return Promise.resolve(this.jobs.length);
  }

  getNumWorkers(): Promise<number> {
    return Promise.resolve(1);
  }

  getNumBusyWorkers(): Promise<number> {
    if (this.worker.activeJob) {
      return Promise.resolve(1);
    }
    return Promise.resolve(0);
  }

  setPoolSize(_: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
  request<M extends Methods>(
    method: M,
    params: Params<M>,
    cb: Callback<M>,
    priority = 1,
  ): Promise<number> {
    const job: Job<M> = {
      id: this.counter++,
      priority,
      params,
      method,
      callback: cb,
    };

    this.jobs.push(job);

    this.tryDispatchJob();

    return Promise.resolve(job.id);
  }
  setPriority(ref: number, priority: number): void {
    const job = this.jobs.find((j) => j.id === ref);
    if (job) {
      job.priority = priority;
    }
  }
  cancel(ref: number): void {
    const job = this.jobs.find((j) => j.id === ref);
    if (!job) {
      return;
    }

    job.callback({
      error: new JobCanceledError(),
    });

    this.removeJob(ref);
  }

  private removeJob(id: number) {
    this.jobs = this.jobs.filter((job) => job.id !== id);
  }

  private tryDispatchJob() {
    if (this.worker.activeJob) {
      return;
    }

    const job = this.jobs.sort((a, b) => {
      if (a.priority === b.priority) {
        return b.id - a.id;
      }
      return b.priority - a.priority;
    })[0];

    if (!job) {
      return;
    }

    this.worker.handle(job);
  }

  on(
    _event: "metrics",
    _cb: (metrics: ExplorerPoolMetrics) => void,
    _opts?: { once?: boolean | undefined } | undefined,
  ): void {
    throw new Error("Method not implemented.");
  }
  off(_event: "metrics", _cb: (metrics: ExplorerPoolMetrics) => void): void {
    throw new Error("Method not implemented.");
  }
}
