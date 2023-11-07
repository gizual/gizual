import { z } from "zod";

declare const self: DedicatedWorkerGlobalScope;

import { observable } from "@trpc/server/observable";
import { expose, transfer } from "comlink";
import { EventEmitter } from "eventemitter3";

import { Database } from "@giz/database";
import { PoolPortal } from "@giz/explorer-web";
import { applyWebWorkerHandler } from "@giz/trpc-webworker/adapter";

import { t } from "./trpc";

if (typeof window !== "undefined") {
  throw new TypeError("Must be run in a worker");
}

const DB = new Database();
let EXP: PoolPortal | undefined;

const EE = new EventEmitter<{ "update-global-state": State }>();

const STATE = {
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

export type State = typeof STATE;

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
      return authors;
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

async function openRepo(explorerPort: MessagePort): Promise<void> {
  DB.init(explorerPort).then(() => {
    updateGlobalState({
      authorsLoaded: true,
    });
  });
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

const exports = {
  setup,
  openRepo,
};

export type MaestroWorker = typeof exports;

expose(exports);
