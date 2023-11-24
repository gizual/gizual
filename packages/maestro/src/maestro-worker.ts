import { z } from "zod";

declare const self: DedicatedWorkerGlobalScope;

import { observable } from "@trpc/server/observable";
import { expose, transfer } from "comlink";
import { EventEmitter } from "eventemitter3";

import { Database } from "@giz/database";
import { PoolController, PoolControllerOpts, PoolPortal } from "@giz/explorer-web";
import { SearchQueryType } from "@giz/query";
import { applyWebWorkerHandler } from "@giz/trpc-webworker/adapter";

import { t } from "./trpc-worker";

if (typeof window !== "undefined") {
  throw new TypeError("Must be run in a worker");
}

const DB = new Database();
let EXP_CONTROLLER: PoolController | undefined;
// eslint-disable-next-line unused-imports/no-unused-vars
let EXP: PoolPortal | undefined;

const EE = new EventEmitter<{ "update-global-state": State; "update-query": SearchQueryType }>();

let QUERY: SearchQueryType = {};

export type State = {
  screen: "welcome" | "initial-load" | "main";
  queryValid: boolean;
  repoLoaded: boolean;
  authorsLoaded: boolean;
  commitsIndexed: boolean;
  filesIndexed: boolean;

  numExplorerWorkersTotal: number;
  numExplorerWorkersBusy: number;
  numExplorerJobs: number;

  numRendererWorkers: number;
  numRendererWorkersBusy: number;
  numRendererJobs: number;
};

const STATE: State = {
  screen: "welcome" as "welcome" | "initial-load" | "main",
  queryValid: false,
  repoLoaded: false,
  authorsLoaded: false,
  commitsIndexed: false,
  filesIndexed: false,

  numExplorerWorkersTotal: 0,
  numExplorerWorkersBusy: 0,
  numExplorerJobs: 0,

  numRendererWorkers: 0,
  numRendererWorkersBusy: 0,
  numRendererJobs: 0,
};

function setQuery(partial: SearchQueryType) {
  QUERY = partial;
  EE.emit("update-query", STATE);
}

function updateQuery(partial: Partial<SearchQueryType>) {
  Object.assign(QUERY, partial);
  EE.emit("update-query", STATE);
}

function updateGlobalState(update: Partial<State>) {
  Object.assign(STATE, update);
  EE.emit("update-global-state", STATE);
}

async function untilState<K extends keyof State>(key: K, value: State[K]) {
  if (STATE[key] === value) {
    return;
  }
  return new Promise<void>((resolve) => {
    const onStateUpdate = (state: State) => {
      if (state[key] === value) {
        EE.off("update-global-state", onStateUpdate);
        resolve();
      }
    };
    EE.on("update-global-state", onStateUpdate);
  });
}

const router = t.router({
  globalState: t.procedure.subscription(() => {
    return observable<State>((emit) => {
      const onStateUpdate = (data: State) => {
        emit.next(data);
      };
      EE.on("update-global-state", onStateUpdate);

      return () => {
        EE.off("update-global-state", onStateUpdate);
      };
    });
  }),
  query: t.procedure.subscription(() => {
    return observable<SearchQueryType>((emit) => {
      const onUpdate = (data: SearchQueryType) => {
        emit.next(data);
      };
      EE.on("update-query", onUpdate);

      return () => {
        EE.off("update-query", onUpdate);
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
      setQuery(input.input);
    }),
  updateQuery: t.procedure
    .input(
      z.object({
        input: z.any(), // TODO: make type safe
      }),
    )
    .mutation(({ input }) => {
      updateQuery(input.input);
    }),

  authorList: t.procedure
    .input(
      z.object({
        limit: z.number().int().positive().default(10),
        offset: z.number().int().default(0),
      }),
    )
    .query(async (opts) => {
      await untilState("authorsLoaded", true);

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

async function setup(): Promise<{
  trpcPort: MessagePort;
}> {
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
  if (EXP_CONTROLLER) {
    throw new Error("Already setup");
  }

  updateGlobalState({ screen: "initial-load" });

  EXP_CONTROLLER = await PoolController.create(opts);

  EXP_CONTROLLER.on("metrics-update", (metrics) => {
    updateGlobalState({
      numExplorerJobs: metrics.numJobsInQueue,
      numExplorerWorkersBusy: metrics.numBusyWorkers,
      numExplorerWorkersTotal: metrics.numTotalWorkers,
    });
  });

  const explorerPort1 = await EXP_CONTROLLER.createPort();
  EXP = new PoolPortal(explorerPort1);
  const explorerPort2 = await EXP_CONTROLLER.createPort();

  DB.init(explorerPort2).then(() => {
    updateGlobalState({
      authorsLoaded: true,
    });
  });

  // TODO: this port is just for legacy reasons to support the old architecture within the main thread
  const legacy_explorerPort3 = await EXP_CONTROLLER.createPort();

  updateGlobalState({ repoLoaded: true, screen: "main" });

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
  if (EXP_CONTROLLER) {
    EXP_CONTROLLER.debugPrint();
  }
}

const exports = {
  setup,
  setupPool,
  debugPrint,
};

export type MaestroWorker = typeof exports;

expose(exports);
