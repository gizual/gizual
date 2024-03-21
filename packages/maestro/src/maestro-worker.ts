import "@giz/logging/worker";

import type { VisualizationSettings } from "@app/controllers";
import { expose, transfer } from "comlink";

import { PoolControllerOpts } from "@giz/explorer-web";
import { createLogger } from "@giz/logging";

import { Maestro, SHARED_EVENTS } from "./maestro-worker-v2";
import { Query } from "./query-utils";

const logger = createLogger("transport");

if (typeof window !== "undefined") {
  throw new TypeError("Must be run in a worker");
}

type WindowVariables = {
  devicePixelRatio: number;
};

let maestro: Maestro = undefined as any;

async function setup(vars: WindowVariables, sharedEventsPort: MessagePort) {
  maestro = new Maestro({
    devicePixelRatio: vars.devicePixelRatio,
  });
  for (const event of SHARED_EVENTS) {
    maestro.on(event, (...data) => {
      sharedEventsPort.postMessage({
        type: event,
        payload: data,
      });
    });
  }
}

async function setupPool(opts: PoolControllerOpts) {
  const controller = await maestro.setup(opts);

  // TODO: this port is just for legacy reasons to support the old architecture within the main thread
  const legacy_explorerPort3 = await controller.createPort();

  return transfer(
    {
      legacy_explorerPort: legacy_explorerPort3,
    },
    [legacy_explorerPort3],
  );
}

function debugPrint() {
  maestro.debugPrint();
}

function setVisualizationSettings(settings: VisualizationSettings) {
  logger.log("setVisualizationSettings", settings);
  maestro.updateVisualizationSettings(settings);
}

function setDevicePixelRatio(devicePixelRatio: number) {
  logger.log("setDevicePixcelRatio", devicePixelRatio);
  maestro.updateDevicePixelRatio(devicePixelRatio);
}

const exports = {
  setup,
  setupPool,
  debugPrint,
  setVisualizationSettings,
  setDevicePixelRatio,
  getFileContent: (path: string) => {
    return maestro.getFileContent(path);
  },
  setBlockInView: (id: string, inView: boolean) => {
    maestro.setBlockInView(id, inView);
  },
  setScale: (scale: number) => {
    maestro.setScale(scale);
  },
  updateQuery: (newQuery: Partial<Query>) => {
    maestro.updateQuery(newQuery);
  },
  setQuery: (newQuery: Query) => {
    maestro.updateQuery(newQuery);
  },
  setTimeMode: (mode: "rangeByDate" | "rangeByRef" | "sinceFirstCommitBy") => {
    maestro.setTimeMode(mode);
  },
  async getAuthorList(opts: { limit: number; offset: number; search: string }) {
    const { limit, offset, search } = opts;
    const authors = await maestro.getAuthors(offset, limit, search);
    const total = await maestro.getAuthorCount();

    return {
      authors,
      total,
    };
  },
};

export type MaestroWorker = typeof exports;

expose(exports);
