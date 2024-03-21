import "@giz/logging/worker";

import type { VisualizationSettings } from "@app/controllers";
import { observable } from "@trpc/server/observable";
import { expose, transfer } from "comlink";
import { z } from "zod";

import { PoolControllerOpts } from "@giz/explorer-web";
import { createLogger } from "@giz/logging";
import { applyWebWorkerHandler } from "@giz/trpc-webworker/adapter";

import {
  Block,
  BlockImage,
  Maestro,
  MaestroWorkerEvents,
  SHARED_EVENTS,
} from "./maestro-worker-v2";
import { Query } from "./query-utils";
import { t } from "./trpc-worker";

const logger = createLogger("trpc");

if (typeof window !== "undefined") {
  throw new TypeError("Must be run in a worker");
}

type WindowVariables = {
  devicePixelRatio: number;
};

let maestro: Maestro = undefined as any;

const router = t.router({
  blockImages: t.procedure.input(z.object({ id: z.string() })).subscription(({ input }) => {
    return observable<BlockImage>((emit) => {
      const onUpdate = (id: string, data: BlockImage) => {
        if (id === input.id) {
          emit.next(data);
        }
      };

      const onRemove = (id: string) => {
        if (id === input.id) {
          emit.complete();
        }
      };

      maestro.on("block:updated", onUpdate);
      maestro.on("block:removed", onRemove);

      emit.next(maestro.getBlockImage(input.id));

      return () => {
        maestro.off("block:updated", onUpdate);
        maestro.off("block:removed", onRemove);
      };
    });
  }),
  fileContent: t.procedure
    .input(
      z.object({
        path: z.string(),
      }),
    )
    .query(async (opts) => {
      const { path } = opts.input;

      return maestro.getFileContent(path);
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof router;

async function setup(
  vars: WindowVariables,
  sharedEventsPort: MessagePort,
): Promise<{
  trpcPort: MessagePort;
}> {
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

  const { port1, port2 } = new MessageChannel();

  const _ = applyWebWorkerHandler({
    router,
    port: port2,
  });
  return transfer(
    {
      trpcPort: port1,
    },
    [port1],
  );
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
