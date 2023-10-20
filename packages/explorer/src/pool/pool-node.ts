import { isString } from "lodash";

import wasmFileUrl from "@giz/explorer-backend-libgit2/dist/explorer-backend-libgit2.wasm?url";
import { WasiRuntime } from "@giz/wasi-runtime";

import { DataResponse, ErrorResponse, JobWithOrigin } from "./types";

/**
 * A PoolNode represents single worker in the pool, but lives within the pool-master thread
 */
export class PoolNode {
  starting!: Promise<void>;

  runtime?: WasiRuntime;
  activeJob?: JobWithOrigin;

  get busy() {
    return !!this.activeJob;
  }

  get started() {
    return !!this.runtime;
  }

  constructor() {}

  boot(handle: FileSystemDirectoryHandle) {
    this.starting = this._boot(handle);
  }

  private async _boot(handle: FileSystemDirectoryHandle): Promise<void> {
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
    let maxTries = 100;
    while (!stdout && maxTries--) {
      stdout = await runtime.readStdout();

      if (!stdout) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (maxTries <= 0) {
      throw new Error("Timeout waiting for worker to start");
    }

    const data = JSON.parse(stdout);
    if (!data?.ready) {
      throw new Error(data.error);
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

    const { id, method, params } = job;

    const payload = {
      jsonrpc: "2.0",
      id,
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

      const isIntermediateResponse = !isString(data?.jsonrpc);
      //this.logger.trace("stdout", stdout);

      if (data.error) {
        this.sendError(job, data.error.message);
        break;
      }
      if (!isIntermediateResponse) {
        this.sendResponse(job, data.result, true);
        break;
      }

      this.sendResponse(job, data);
    }
    this.activeJob = undefined;
  }

  dispose() {
    this.runtime?.dispose();
  }
}
