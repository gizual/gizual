import * as Comlink from "comlink";

import { GizWorker } from "@giz/worker";

import type { PoolMaster, PoolMetrics } from "./pool-master";

export type PoolControllerOpts = {
  maxConcurrency?: number;
  directoryHandle?: FileSystemDirectoryHandle;
  zipFile?: Uint8Array;
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

  on(_: "metrics-update", listener: (metrics: PoolMetrics) => void) {
    this.worker.onmessage = (message) => {
      const metrics = message.data;
      const result: PoolMetrics = {
        numAvailableWorkers: metrics.numAvailableWorkers ?? 0,
        numBusyWorkers: metrics.numBusyWorkers ?? 0,
        numIdleWorkers: metrics.numIdleWorkers ?? 0,
        numJobsInQueue: metrics.numJobsInQueue ?? 0,
        numTotalWorkers: metrics.numTotalWorkers ?? 0,
        numOpenPorts: metrics.numOpenPorts ?? 0,
      };

      listener(result);
    };
  }

  private constructor(worker: Worker, pool: Comlink.Remote<PoolMaster>) {
    this.worker = worker;
    this.pool = pool;
  }

  static async create(opts: PoolControllerOpts) {
    if (!opts.directoryHandle && !opts.zipFile) {
      throw new Error("No directory handle or zip file provided");
    }

    const worker = new GizWorker(new URL("pool-master.ts", import.meta.url), { type: "module" });
    const remote = Comlink.wrap<PoolMaster>(worker);

    if (opts.directoryHandle) {
      await remote.init(opts.directoryHandle!, opts.maxConcurrency);
    } else if (opts.zipFile) {
      await remote.init(Comlink.transfer(opts.zipFile, [opts.zipFile.buffer]), opts.maxConcurrency);
    } else {
      throw new Error("No directory handle or zip file to use");
    }

    const controller = new PoolController(worker, remote);

    return controller;
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
