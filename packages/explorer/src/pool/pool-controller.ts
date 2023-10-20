import * as Comlink from "comlink";
import { action, makeObservable, observable } from "mobx";

import type { PoolMaster, PoolMetrics } from "./pool-master";

export type PoolControllerOpts = {
  maxConcurrency?: number;
  directoryHandle: FileSystemDirectoryHandle;
};

/**
 * The PoolController is responsible for creating the pool and managing it from the main thread.
 * It can be used to scale the pool up or down, or to terminate it.
 * It can also be used to create new message channel to send jobs to the pool,
 * but can not itself send jobs.
 */
export class PoolController {
  private worker: Worker;
  private pool: Comlink.Remote<PoolMaster>;

  metrics: PoolMetrics = {
    numAvailableWorkers: 0,
    numBusyWorkers: 0,
    numIdleWorkers: 0,
    numJobsInQueue: 0,
    numTotalWorkers: 0,
    numOpenPorts: 0,
  };

  private constructor(worker: Worker, pool: Comlink.Remote<PoolMaster>) {
    this.worker = worker;
    this.pool = pool;

    makeObservable(this, {
      metrics: observable,
      metricsCallback: action.bound,
    });

    this.worker.addEventListener("message", this.metricsCallback);
  }

  static async create(opts: PoolControllerOpts) {
    const worker = new Worker(new URL("pool-master.ts", import.meta.url), { type: "module" });
    const remote = Comlink.wrap<PoolMaster>(worker);

    await remote.init(opts.directoryHandle, opts.maxConcurrency);

    const controller = new PoolController(worker, remote);

    return controller;
  }

  metricsCallback(message: MessageEvent<PoolMetrics>) {
    const metrics = message.data;
    this.metrics.numAvailableWorkers = metrics.numAvailableWorkers ?? 0;
    this.metrics.numBusyWorkers = metrics.numBusyWorkers ?? 0;
    this.metrics.numIdleWorkers = metrics.numIdleWorkers ?? 0;
    this.metrics.numJobsInQueue = metrics.numJobsInQueue ?? 0;
    this.metrics.numTotalWorkers = metrics.numTotalWorkers ?? 0;
    this.metrics.numOpenPorts = metrics.numOpenPorts ?? 0;
  }

  async createPort(): Promise<MessagePort> {
    const { port1, port2 } = new MessageChannel();
    await this.pool.registerPort(Comlink.transfer(port2, [port2]));
    return port1;
  }

  debugPrint() {
    this.pool.debugPrint();
  }
}
