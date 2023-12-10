import { isEqual } from "lodash";
import { z } from "zod";

declare const self: DedicatedWorkerGlobalScope;

import type { VisualizationSettings } from "@app/controllers";
import { observable, Observer } from "@trpc/server/observable";
import { expose, transfer } from "comlink";
import { EventEmitter } from "eventemitter3";
import { minimatch } from "minimatch";

import { Database } from "@giz/database";
import { Blame, CommitInfo } from "@giz/explorer";
import { Author, FileTreeNode, InitialDataResult } from "@giz/explorer";
import { JobRef, PoolController, PoolControllerOpts, PoolPortal } from "@giz/explorer-web";
import { FileRendererPool, RenderType } from "@giz/file-renderer";
import { SearchQueryType } from "@giz/query";
import { applyWebWorkerHandler } from "@giz/trpc-webworker/adapter";
import { getDateFromTimestamp, getStringDate } from "@giz/utils/gizdate";
import { GizDate } from "@giz/utils/gizdate";

import { t } from "./trpc-worker";

if (typeof window !== "undefined") {
  throw new TypeError("Must be run in a worker");
}
type WindowVariables = {
  devicePixelRatio: number;
};

const windowVars: WindowVariables = {
  devicePixelRatio: 1,
};

const VISUAL_SETTINGS: VisualizationSettings = {} as any;

const DB = new Database();
let EXP_CONTROLLER: PoolController | undefined;
// eslint-disable-next-line unused-imports/no-unused-vars
let EXP: PoolPortal | undefined;
const RENDER_POOL = new FileRendererPool();

const EE = new EventEmitter<{
  "update-global-state": State;
  "update-query": SearchQueryType;
  "update-selected-files": Array<FileTreeNode>;
  "update-blocks": Array<Block>;
}>();

let QUERY: SearchQueryType = {
  branch: "main",
  type: "file-lines",
};

export type State = {
  screen: "welcome" | "initial-load" | "main";
  queryValid: boolean;
  repoLoaded: boolean;
  authorsLoaded: boolean;
  commitsIndexed: boolean;
  filesIndexed: boolean;

  numSelectedFiles: number;
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

  numSelectedFiles: 0,
  numExplorerWorkersTotal: 0,
  numExplorerWorkersBusy: 0,
  numExplorerJobs: 0,

  numRendererWorkers: 0,
  numRendererWorkersBusy: 0,
  numRendererJobs: 0,
};
type Block = {
  id: string;
  height: number;
};

type BlockImage = {
  url: string;
  isPreview: boolean;
};

let authorList: Author[] = [];
let currentFileTree: FileTreeNode[] | undefined = undefined;
let currentSelectedFiles: FileTreeNode[] = [];
let currentBlocks: Block[] = [];

function setCurrentSelectedFiles(files: FileTreeNode[]) {
  EE.emit("update-selected-files", ...files);
  updateGlobalState({
    numSelectedFiles: files.length,
  });
  currentSelectedFiles = files;
}

function setCurrentBlocks(blocks: Block[]) {
  EE.emit("update-blocks", ...blocks);
  currentBlocks = blocks;
  blockManager.refresh(currentSelectedFiles);
}

async function onUpdateQuery(query: SearchQueryType) {
  console.log("onUpdateQuery", query);
  const { branch, time, files } = query;

  if (branch !== QUERY.branch || !isEqual(time, QUERY.time) || !currentFileTree) {
    // update file tree
    // TODO: support time range
    const tree = await EXP?.getFileTree(branch);
    if (tree) {
      currentFileTree = tree;
    }
  }

  if (!files || !("path" in files)) {
    return;
  }

  const globPatterns = Array.isArray(files.path) ? files.path : [files.path];

  if (!currentFileTree) {
    return;
  }

  const selectedFiles = currentFileTree.filter((node) => {
    if (node.kind === "folder") {
      return false;
    }
    const result = globPatterns.some((p) => minimatch(node.path.join("/"), p, { matchBase: true }));
    return result;
  });

  setCurrentSelectedFiles(selectedFiles);

  const fileContentLengths = await Promise.all(
    selectedFiles.map(
      (file) =>
        EXP?.getFileContent(branch, file.path.join("/")).then((c) => c.split("\n").length) ?? 0,
    ),
  );

  const newBlocks: Block[] = selectedFiles.map((file, i) => ({
    id: file.path.join("/"),
    height: fileContentLengths[i] * 10,
  }));

  setCurrentBlocks(newBlocks);
}

EE.on("update-query", onUpdateQuery);

function setQuery(newQuery: SearchQueryType) {
  EE.emit("update-query", newQuery);
  QUERY = newQuery;
}

function updateQuery(partial: Partial<SearchQueryType>) {
  const copy = { ...QUERY };
  Object.assign(copy, partial);
  EE.emit("update-query", copy);
  QUERY = copy;
}

function updateGlobalState(update: Partial<State>) {
  const copy = { ...STATE };
  Object.assign(copy, update);
  EE.emit("update-global-state", copy);
  Object.assign(STATE, update);
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
type BlockData = {
  url: string;
  isPreview: boolean;
  priority: number;
  emit?: Observer<BlockImage, unknown>;
  blameJobRef?: JobRef<Blame>;
};

class BlockManager {
  private readonly blocks = new Map<string, BlockData>();

  constructor() {}

  refresh(files: FileTreeNode[]) {
    this.blocks.clear();

    for (const file of files) {
      this.blocks.set(file.path.join("/"), {
        url: "",
        isPreview: false,
        priority: 0,
      });
    }
  }

  getBlock(id: string) {
    return this.blocks.get(id);
  }

  registerSubscription(id: string, emit: Observer<BlockImage, unknown>) {
    const block = this.blocks.get(id);
    if (!block) {
      throw new Error("Block not found");
    }
    block.emit = emit;

    block.blameJobRef = EXP!.getBlame(QUERY.branch, id, false) as any;

    block.blameJobRef?.promise.then(async (blame) => {
      const { lines, maxLineLength } = parseLines(blame);
      const { earliestTimestamp, latestTimestamp } = parseCommitTimestamps(blame);

      const selectedStartDate =
        QUERY.time && "rangeByDate" in QUERY.time
          ? new GizDate(QUERY.time.rangeByDate[0])
          : getDateFromTimestamp(earliestTimestamp.toString());

      const selectedEndDate =
        QUERY.time && "rangeByDate" in QUERY.time
          ? new GizDate(QUERY.time.rangeByDate[1])
          : getDateFromTimestamp(latestTimestamp.toString());

      if (lines.length === 0) {
        return;
      }

      const { result } = await RENDER_POOL.renderCanvas({
        type: RenderType.FileLines,
        fileContent: lines,
        lineLengthMax: maxLineLength,
        coloringMode: "age",
        authors: authorList,
        showContent: true,
        dpr: 4,
        earliestTimestamp,
        latestTimestamp,
        selectedStartDate,
        selectedEndDate,
        rect: new DOMRect(0, 0, 300, lines.length * 10),
        isPreview: false,
        visualizationConfig: {
          colors: {
            newest: VISUAL_SETTINGS.colors.new.value,
            oldest: VISUAL_SETTINGS.colors.old.value,
            notLoaded: VISUAL_SETTINGS.colors.notLoaded.value,
          },
          style: {
            lineLength: VISUAL_SETTINGS.style.lineLength.value,
          },
        },
      });

      block.url = result;
      emit.next({
        url: result,
        isPreview: false,
      });
    });

    return () => {
      this.dispose(id);
    };
  }

  setBlockPriority(id: string, priority: number) {
    const block = this.blocks.get(id);
    if (!block) {
      throw new Error("Block not found");
    }
    block.priority = priority;
    if (!block.emit) {
      console.warn("No emit for", id);
      return;
    }

    if (!block.blameJobRef) {
      console.warn("No blame job ref for", id);
    }

    block.blameJobRef?.setPriority(priority);
  }

  dispose(id: string) {
    const block = this.blocks.get(id);
    if (!block) {
      throw new Error("Block not found");
    }
    block.emit = undefined;
    if (block.url) {
      URL.revokeObjectURL(block.url);
      block.url = "";
    }
  }

  setBlock(id: string, data: BlockData) {
    this.blocks.set(id, data);
  }

  deleteBlock(id: string) {
    this.blocks.delete(id);
  }

  clear() {
    this.blocks.clear();
  }
}

const blockManager = new BlockManager();

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

      onUpdate(QUERY);

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
  setPriority: t.procedure
    .input(z.object({ id: z.string(), priority: z.number().positive() }))
    .mutation(async ({ input }) => {
      blockManager.setBlockPriority(input.id, input.priority);
    }),
  selectedFiles: t.procedure.subscription(() => {
    return observable<FileTreeNode[]>((emit) => {
      const onUpdate = (...data: FileTreeNode[]) => {
        emit.next(data);
      };
      EE.on("update-selected-files", onUpdate);

      onUpdate(...currentSelectedFiles);

      return () => {
        EE.off("update-selected-files", onUpdate);
      };
    });
  }),
  blocks: t.procedure.subscription(() => {
    return observable<Block[]>((emit) => {
      const onUpdate = (...data: Block[]) => {
        emit.next(data);
      };
      EE.on("update-blocks", onUpdate);

      onUpdate(...currentBlocks);

      return () => {
        EE.off("update-blocks", onUpdate);
      };
    });
  }),
  blockImages: t.procedure.input(z.object({ id: z.string() })).subscription(({ input }) => {
    return observable<BlockImage>((emit) => {
      const dispose = blockManager.registerSubscription(input.id, emit);
      return dispose;
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
  Object.assign(windowVars, vars);
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

  DB.init(explorerPort2).then(async () => {
    updateGlobalState({
      authorsLoaded: true,
    });
    const authorsCount = await DB.countAuthors();
    authorList = await DB.queryAuthors(0, authorsCount);
  });

  const initial_data = await EXP.execute<InitialDataResult>("get_initial_data", {}).promise;
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
  };
  setQuery(query);

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
  } else {
    console.log("No pool controller");
  }
}

function setVisualizationSettings(settings: VisualizationSettings) {
  console.log("setVisualizationSettings", settings);
  Object.assign(VISUAL_SETTINGS, settings);
}

function parseCommitTimestamps(blame: Blame): {
  earliestTimestamp: number;
  latestTimestamp: number;
} {
  let earliestTimestamp = Number.MAX_SAFE_INTEGER;
  let latestTimestamp = Number.MIN_SAFE_INTEGER;

  for (const commit of Object.values(blame.commits)) {
    earliestTimestamp = Math.min(+commit.timestamp, earliestTimestamp);
    latestTimestamp = Math.max(+commit.timestamp, latestTimestamp);
  }

  return { earliestTimestamp, latestTimestamp };
}

export type Line = {
  content: string;
  commit?: CommitInfo;
  color?: string;
};

function parseLines(blame: Blame) {
  let lenMax = 0;
  const lines: Line[] = blame.lines.map((l) => {
    const commit = blame.commits[l.commitId];

    lenMax = Math.max(l.content.length, lenMax);
    return {
      content: l.content,
      commit,
    };
  });
  const maxLineLength = Math.min(lenMax, 200);

  return { lines, maxLineLength };
}

const exports = {
  setup,
  setupPool,
  debugPrint,
  setVisualizationSettings,
};

export type MaestroWorker = typeof exports;

expose(exports);
