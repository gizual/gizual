import { z } from "zod";

declare const self: DedicatedWorkerGlobalScope;

import type { VisualizationSettings } from "@app/controllers";
import { observable } from "@trpc/server/observable";
import { expose, transfer } from "comlink";

import { FileTreeNode } from "@giz/explorer";
import { PoolControllerOpts } from "@giz/explorer-web";
import { SearchQueryType } from "@giz/query";
import { applyWebWorkerHandler } from "@giz/trpc-webworker/adapter";

import { Block, BlockImage, Events, Maestro, State } from "./maestro-worker-v2";
import { t } from "./trpc-worker";

if (typeof window !== "undefined") {
  throw new TypeError("Must be run in a worker");
}

type WindowVariables = {
  devicePixelRatio: number;
};

let maestro: Maestro = undefined as any;

const router = t.router({
  metrics: t.procedure.subscription(() => {
    return observable<Maestro["metrics"]>((emit) => {
      const onUpdate = (data: Events["metrics:updated"][0]) => {
        emit.next(data.newValue);
      };
      maestro.on("metrics:updated", onUpdate);

      emit.next(maestro.metrics);

      return () => {
        maestro.off("metrics:updated", onUpdate);
      };
    });
  }),
  globalState: t.procedure.subscription(() => {
    return observable<State>((emit) => {
      const onStateUpdate = (data: Events["state:updated"][0]) => {
        emit.next(data.newValue);
      };
      maestro.on("state:updated", onStateUpdate);

      emit.next(maestro.state);

      return () => {
        maestro.off("state:updated", onStateUpdate);
      };
    });
  }),
  query: t.procedure.subscription(() => {
    return observable<SearchQueryType>((emit) => {
      const onUpdate = (data: Events["query:updated"][0]) => {
        emit.next(data.newValue);
      };
      maestro.on("query:updated", onUpdate);

      emit.next(maestro.query);

      return () => {
        maestro.off("query:updated", onUpdate);
      };
    });
  }),
  setQuery: t.procedure
    .input(
      z.object({
        input: z.any(), // TODO: make type safe
      }),
    )
    .mutation(({ input }) => {
      maestro.updateQuery(input.input);
    }),
  updateQuery: t.procedure
    .input(
      z.object({
        input: z.any(), // TODO: make type safe
      }),
    )
    .mutation(({ input }) => {
      maestro.updateQuery(input.input);
    }),
  setPriority: t.procedure
    .input(z.object({ id: z.string(), priority: z.number().positive() }))
    .mutation(async ({ input }) => {
      maestro.setBlockPriority(input.id, input.priority);
    }),
  selectedFiles: t.procedure.subscription(() => {
    //TODO maybe wrong args
    return observable<FileTreeNode[]>((emit) => {
      const onUpdate = ({ newValue }: Events["selected-files:updated"][0]) => {
        emit.next(newValue);
      };
      maestro.on("selected-files:updated", onUpdate);
      emit.next(maestro.selectedFiles);

      return () => {
        maestro.off("selected-files:updated", onUpdate);
      };
    });
  }),
  blocks: t.procedure.subscription(() => {
    return observable<Block[]>((emit) => {
      const onUpdate = (data: Events["blocks:updated"][0]) => {
        emit.next(data);
      };
      maestro.on("blocks:updated", onUpdate);

      emit.next(maestro.blocks);

      return () => {
        maestro.off("blocks:updated", onUpdate);
      };
    });
  }),
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
  authorList: t.procedure
    .input(
      z.object({
        limit: z.number().int().positive().default(10),
        offset: z.number().int().default(0),
      }),
    )
    .query(async (opts) => {
      await maestro.untilState("authorsLoaded", true);

      const { limit, offset } = opts.input;

      const authors = await maestro.getAuthors(offset, limit);
      const total = await maestro.getAuthorCount();

      return {
        authors,
        total,
      };
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof router;

async function setup(vars: WindowVariables): Promise<{
  trpcPort: MessagePort;
}> {
  maestro = new Maestro({
    devicePixelRatio: vars.devicePixelRatio,
  });
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
  console.log("setVisualizationSettings", settings);
  maestro.updateVisualizationSettings(settings);
}

function setDevicePixelRatio(devicePixelRatio: number) {
  console.log("setDevicePixcelRatio", devicePixelRatio);
  maestro.updateDevicePixelRatio(devicePixelRatio);
}

const exports = {
  setup,
  setupPool,
  debugPrint,
  setVisualizationSettings,
  setDevicePixelRatio,
};

export type MaestroWorker = typeof exports;

expose(exports);
