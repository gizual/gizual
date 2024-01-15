import { z } from "zod";

declare const self: DedicatedWorkerGlobalScope;

import type { VisualizationSettings } from "@app/controllers";
import { observable } from "@trpc/server/observable";
import { expose, transfer } from "comlink";

import { Database } from "@giz/database";
import { Author, FileTreeNode, InitialDataResult } from "@giz/explorer";
import { PoolControllerOpts } from "@giz/explorer-web";
import { SearchQueryType } from "@giz/query";
import { applyWebWorkerHandler } from "@giz/trpc-webworker/adapter";
import { getDateFromTimestamp, getStringDate } from "@giz/utils/gizdate";

import { Block, BlockImage, Events, Maestro, State } from "./maestro-worker-v2";
import { t } from "./trpc-worker";

if (typeof window !== "undefined") {
  throw new TypeError("Must be run in a worker");
}

type WindowVariables = {
  devicePixelRatio: number;
};

const DB = new Database();

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

      const authors = await DB.queryAuthors(offset, limit);
      const count = await DB.countAuthors();

      return {
        authors,
        total: count,
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
  maestro.updateState({ screen: "initial-load" });

  const controller = await maestro.createExplorerController(opts);

  const explorerPort2 = await controller.createPort();

  DB.init(explorerPort2).then(async () => {
    maestro.updateState({
      authorsLoaded: true,
    });
    //const authorsCount = await DB.countAuthors();
    //authorList = await DB.queryAuthors(0, authorsCount);
  });

  const initial_data = await maestro.explorerPool!.execute<InitialDataResult>(
    "get_initial_data",
    {},
  ).promise;
  // TODO: determine name of repo from remote urls if possible

  const endDate = getDateFromTimestamp(initial_data.commit.timestamp);

  const startDate = endDate.subtractDays(365);

  const query: SearchQueryType = {
    branch: initial_data.currentBranch,
    type: "file-lines",
    time: {
      rangeByDate: [getStringDate(startDate), getStringDate(endDate)],
    },
    files: {
      //changedInRef: initial_data.currentBranch,
      path: "*.js",
    },
    preset: {
      gradientByAge: [
        maestro.visualizationSettings.colors.old.defaultValue,
        maestro.visualizationSettings.colors.new.defaultValue,
      ],
    },
  };
  maestro.updateQuery(query);

  // TODO: this port is just for legacy reasons to support the old architecture within the main thread
  const legacy_explorerPort3 = await controller.createPort();

  maestro.updateState({ repoLoaded: true, screen: "main" });

  return transfer(
    {
      legacy_explorerPort: legacy_explorerPort3,
    },
    [legacy_explorerPort3],
  );
}

/*
  async selectMatchingFiles(path: string, editedBy: string) {
    this.repoController.unloadAllFiles();

    const files = await this._database.selectMatchingFiles(
      path,
      editedBy,
      this.repoController.selectedBranch,
    );

    for (const file of files) {
      this.repoController.toggleFile(file, {
        path: file,
        title: file,
        // eslint-disable-next-line unicorn/no-null
        fileIconColor: [null, null],
      });
    }
  }
  */

function debugPrint() {
  maestro.debugPrint();
}

function setVisualizationSettings(settings: VisualizationSettings) {
  console.log("setVisualizationSettings", settings);
  maestro.setVisualizationSettings(settings);
}

const exports = {
  setup,
  setupPool,
  debugPrint,
  setVisualizationSettings,
};

export type MaestroWorker = typeof exports;

expose(exports);
