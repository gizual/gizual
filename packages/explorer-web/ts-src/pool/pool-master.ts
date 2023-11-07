import * as Comlink from "comlink";

import { PoolNode } from "./pool-node";
import { JobWithOrigin, PoolTask } from "./types";

export type PoolMetrics = {
  numTotalWorkers: number;
  numAvailableWorkers: number;
  numIdleWorkers: number;
  numBusyWorkers: number;
  numJobsInQueue: number;
  numOpenPorts: number;
};

const DEFAULT_MAX_CONCURRENCY = navigator.hardwareConcurrency || 4;

const SCHEDULER_INTERVAL = 50;

const METRICS_UPDATE_INTERVAL = 200;

/**
 * The PoolMaster is responsible for managing the pool and scheduling jobs.
 * It is run in its own thread to avoid blocking the main thread.
 * It is controlled by the PoolController from the main thread.
 */
export class PoolMaster {
  maxConcurrency = DEFAULT_MAX_CONCURRENCY;
  directoryHandle!: FileSystemDirectoryHandle;
  zipFile!: Uint8Array;
  schedulerInterval: any;
  metricsUpdateInterval: any;
  workers: PoolNode[] = [];
  metricsCallback: ((metrics: PoolMetrics) => void) | undefined;
  ports: MessagePort[] = [];
  jobs: JobWithOrigin[] = [];

  constructor() {
    this.onPortMessage = this.onPortMessage.bind(this);
    this.onPortMessageError = this.onPortMessageError.bind(this);

    this.schedulerInterval = setInterval(() => {
      this.schedule();
    }, SCHEDULER_INTERVAL);

    this.metricsUpdateInterval = setInterval(() => {
      this.updateMetrics();
    }, METRICS_UPDATE_INTERVAL);
  }

  updateMetrics() {
    self.postMessage({
      numTotalWorkers: this.totalWorkersCount,
      numAvailableWorkers: this.availableWorkersCount,
      numIdleWorkers: this.idleWorkersCount,
      numBusyWorkers: this.busyWorkersCount,
      numOpenPorts: this.ports.length,
      numJobsInQueue: this.jobs.length,
    });
  }

  setMaxConcurrency(num: number) {
    this.maxConcurrency = num;
  }

  init(source: FileSystemDirectoryHandle | Uint8Array, maxConcurrency?: number) {
    if (source instanceof Uint8Array) {
      this.zipFile = source;
    } else {
      this.directoryHandle = source;
    }
    this.maxConcurrency = maxConcurrency ?? this.maxConcurrency;

    this.updatePoolSize();
  }

  removeWorker(w: PoolNode) {
    const index = this.workers.indexOf(w);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }
    w.dispose();
  }

  registerPort(port: MessagePort) {
    this.ports.push(port);

    port.onmessage = this.onPortMessage;
    port.onmessageerror = this.onPortMessageError;
  }

  onPortMessageError(message: MessageEvent<unknown>) {
    console.error("Port message error", message);
  }

  onPortMessage(message: MessageEvent<PoolTask>) {
    const source: MessagePort = (message.srcElement ?? message.source) as MessagePort;
    const data: PoolTask = message.data;

    switch (data.type) {
      case "new": {
        this.jobs.push({
          ...data.job,
          origin: source,
        });
        break;
      }

      case "update": {
        const job = this.jobs.find((j) => j.origin === source && j.id === data.jobId);
        if (job) {
          job.priority = data.priority;
        }
        break;
      }

      case "remove": {
        this.removeJob(data.jobId);
        break;
      }

      case "close": {
        const index = this.ports.indexOf(source);
        if (index !== -1) {
          this.ports.splice(index, 1);
        }
        break;
      }
    }
  }

  removeJob(ref: JobWithOrigin | number) {
    let index = -1;

    index =
      typeof ref === "object"
        ? this.jobs.findIndex((j) => j.origin === ref.origin && j.id === ref.id)
        : ref;

    if (index !== -1) {
      this.jobs.splice(index, 1);
    }
  }

  updatePoolSize(): boolean {
    const totalWorkersCount = this.totalWorkersCount;

    if (totalWorkersCount < this.maxConcurrency) {
      const newWorkers = Array.from(
        { length: this.maxConcurrency - totalWorkersCount },
        () => new PoolNode(),
      );

      this.workers.push(...newWorkers);

      for (const w of newWorkers) {
        w.boot(this.directoryHandle ?? this.zipFile);
      }
      return true;
    } else if (totalWorkersCount > this.maxConcurrency) {
      let numToRemove = totalWorkersCount - this.maxConcurrency;

      while (numToRemove > 0 && this.idleWorkersCount > 0) {
        const w = this.idleWorkers.pop()!;
        this.removeWorker(w);
        numToRemove--;
      }

      return true;
    }

    return false;
  }

  schedule() {
    if (this.updatePoolSize()) {
      return;
    }

    const startTime = performance.now();

    do {
      if (this.jobs.length === 0) {
        return;
      }

      const idleWorkers = this.idleWorkers;

      if (idleWorkers.length === 0) {
        return;
      }

      this.jobs = this.jobs.sort((a, b) => b.priority - a.priority);

      const job = this.jobs.shift()!;

      if (job.priority === 0) {
        this.jobs.push(job);
        return;
      }

      const worker = idleWorkers.pop()!;

      worker.execute(job);
    } while (performance.now() - startTime < SCHEDULER_INTERVAL - 10);
  }

  get totalWorkersCount() {
    return this.workers.length;
  }

  get availableWorkers() {
    return this.workers.filter((w) => w.started);
  }
  get availableWorkersCount() {
    return this.availableWorkers.length;
  }

  get busyWorkers() {
    return this.availableWorkers.filter((w) => w.busy);
  }

  get busyWorkersCount() {
    return this.busyWorkers.length;
  }

  get idleWorkers() {
    return this.availableWorkers.filter((w) => !w.busy);
  }

  get idleWorkersCount() {
    return this.idleWorkers.length;
  }

  debugPrint() {
    console.log("Total workers:", this.totalWorkersCount);
    console.log("Available workers:", this.availableWorkersCount);
    console.log("Busy workers:", this.busyWorkersCount);
    console.log("Idle workers:", this.idleWorkersCount);
    console.log("Jobs in queue:", this.jobs.length);

    console.log("Jobs:");
    console.table(
      this.jobs.map((j) => ({
        id: j.id,
        priority: j.priority,
        method: j.method,
        params: JSON.stringify(j.params),
      })),
    );

    console.log("Workers:");
    console.table(
      this.workers.map((w) => ({
        busy: w.busy,
        activeJob: w.activeJob,
        started: w.started,
      })),
    );
  }
}

Comlink.expose(new PoolMaster());
