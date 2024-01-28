import { isString } from "lodash";

import { WasiRuntime } from "@giz/wasi-runtime";
import wasmFileUrl from "../../build/explorer-web.wasm?url";

import { DataResponse, ErrorResponse, JobWithOrigin } from "./types";

export type PoolNodeOpts = {
  wasmFileUrl?: string;
};

/**
 * A PoolNode represents single worker in the pool, but lives within the pool-master thread
 */
export class PoolNode {
  wasmFileUrl = wasmFileUrl;
  starting!: Promise<void>;

  runtime?: WasiRuntime;
  activeJob?: JobWithOrigin;

  get busy() {
    return !!this.activeJob;
  }

  get started() {
    return !!this.runtime;
  }

  constructor(opts: PoolNodeOpts = {}) {
    if (opts.wasmFileUrl) {
      this.wasmFileUrl = opts.wasmFileUrl;
    }
  }

  boot(handle: FileSystemDirectoryHandle | Uint8Array) {
    this.starting = this._boot(handle);
  }

  private async _boot(handle: FileSystemDirectoryHandle | Uint8Array): Promise<void> {
    const runtime = await WasiRuntime.create({
      moduleUrl: this.wasmFileUrl,
      moduleName: "/module.wasm",
      folderMappings: {
        "/repo": handle,
      },
    });

    await runtime.run({
      env: {},
      args: [],
    });

    await runtime.writeStdin("PING\n");

    const stdout = await runtime.readStdout();

    if (stdout !== "PONG") {
      throw new Error("unable to start worker");
    }

    this.runtime = runtime;
  }

  sendResponse(job: JobWithOrigin, data: any, end?: boolean) {
    const msg: DataResponse = {
      id: job.id,
      data,
      end,
    };
    job.origin.postMessage(msg);
  }

  sendError(job: JobWithOrigin, error: string | Error | unknown) {
    let errorMsg = "";

    if (isString(error)) {
      errorMsg = error;
    } else if (error instanceof Error) {
      errorMsg = error.message;
    } else {
      errorMsg = JSON.stringify(error);
    }

    const msg: ErrorResponse = {
      id: job.id,
      error: errorMsg,
      end: true,
    };
    job.origin.postMessage(msg);
  }

  execute(job: JobWithOrigin): Promise<void> {
    if (this.busy || !this.started || !this.runtime) {
      throw new Error("PoolNode is busy or not started");
    }

    this.activeJob = job;

    const { method, params } = job;

    const payload = {
      method,
      params,
    };

    const payloadString = JSON.stringify(payload) + "\n";
    this.runtime.writeStdin(payloadString);

    return this.handleResponse(job);
  }

  async handleResponse(job: JobWithOrigin) {
    while (this.busy) {
      const stdout = await this.runtime!.readStdout();

      let data;
      try {
        data = JSON.parse(stdout);
      } catch (error) {
        this.sendError(job, error);
        console.error("error parsing stdout", stdout, error);
        break;
      }

      const isIntermediateResponse = !data.end;
      //this.logger.trace("stdout", stdout);

      if (data.error) {
        this.sendError(job, data.error.message ?? data.error);
        break;
      }
      if (!isIntermediateResponse) {
        this.sendResponse(job, data.data, true);
        break;
      }

      this.sendResponse(job, data.data);
    }
    this.activeJob = undefined;
  }

  dispose() {
    this.runtime?.dispose();
  }
}
