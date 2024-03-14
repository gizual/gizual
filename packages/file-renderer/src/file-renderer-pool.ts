import * as Comlink from "comlink";
import { action, makeObservable, observable, runInAction } from "mobx";

import { GizWorker } from "@giz/worker";

import type { FileRendererWorker as FileRendererWorkerI } from "./file-renderer-worker";
import FileRendererWorkerUrl from "./file-renderer-worker?worker&url";
import type { RendererContext } from "./types";

export type RenderJobResult = {
  result: string;
  colors: string[];
};

export type RenderJob = {
  id: number;
  ctx: RendererContext;
  onEnd: (data: RenderJobResult) => void;
  onErr: (err: any) => void;
};

const MAX_SCHEDULE_DURATION = 15; // ms
const SCHEDULE_INTERVAL = 90; // ms

export class FileRendererNode {
  worker: Worker;
  remote: Comlink.Remote<FileRendererWorkerI>;
  activeJob?: RenderJob;

  @observable busy = false;

  constructor(worker: Worker) {
    this.worker = worker;
    this.remote = Comlink.wrap<FileRendererWorkerI>(worker);
    makeObservable(this, undefined, { autoBind: true });
  }

  dispose() {
    this.worker.terminate();
  }

  @action.bound
  runJob(job: RenderJob) {
    this.activeJob = job;
    this.busy = true;

    this.remote
      .drawCanvas(job.ctx)
      .then((result) => {
        runInAction(() => {
          this.busy = false;
          this.activeJob = undefined;
        });
        job.onEnd(result);
      })
      .catch((error) => {
        job.onErr(error);
      });
  }
}

export class FileRendererPool {
  counter = 0;
  poolSize = navigator.hardwareConcurrency ?? 4;

  @observable.shallow jobs: RenderJob[] = [];
  @observable.shallow workers: FileRendererNode[] = [];

  constructor(poolSize?: number) {
    if (poolSize) {
      this.poolSize = poolSize;
    }
    this.scheduleSafe = this.scheduleSafe.bind(this);
    makeObservable(this, undefined, { autoBind: true });

    setTimeout(this.setupPool, 10);
    setTimeout(this.scheduleSafe, 100);
  }

  get numWorkers() {
    return this.workers.length;
  }

  get numJobsInQueue() {
    return this.jobs.length;
  }

  get numBusyWorkers() {
    return this.workers.filter((w) => w.busy).length;
  }

  get idleWorkers() {
    return this.workers.filter((w) => !w.busy);
  }

  @action.bound
  scheduleSafe() {
    const startTime = performance.now();

    do {
      try {
        const worker = this.idleWorkers.pop();
        if (!worker) {
          break;
        }

        const job = this.jobs.shift();
        if (!job) {
          break;
        }

        worker.runJob(job);
      } catch (error) {
        console.error("Error during render schedule", error);
      }
    } while (performance.now() - startTime < MAX_SCHEDULE_DURATION);

    setTimeout(this.scheduleSafe, SCHEDULE_INTERVAL);
  }

  @action.bound
  setupPool() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new GizWorker(FileRendererWorkerUrl, {
        name: `renderer-worker-${i}`,
        type: "module",
      });

      const node = new FileRendererNode(worker);
      this.workers.push(node);
    }
  }

  @action.bound
  renderCanvas(ctx: RendererContext): Promise<RenderJobResult> {
    const promise = new Promise<RenderJobResult>((resolve, reject) => {
      const job = { id: this.counter++, ctx, onEnd: resolve, onErr: reject };
      this.jobs.push(job);
    });

    return promise;
  }
}
