import { VisualizationSettings } from "@app/controllers";
import { VisualizationConfig } from "@app/types";
import EventEmitter from "eventemitter3";
import { differenceBy, isEqual, isNumber, omit, result } from "lodash";
import { minimatch } from "minimatch";
import { autorun } from "mobx";
import { match, Pattern } from "ts-pattern";

import { ColorManager } from "@giz/color-manager";
import { Database } from "@giz/database";
import { Author, Blame, CommitInfo, FileTreeNode, InitialDataResult } from "@giz/explorer";
import {
  FileIcon,
  getFileIcon,
  JobRef,
  PoolController,
  PoolControllerOpts,
  PoolPortal,
} from "@giz/explorer-web";
import { BaseContext, FileRendererPool, RenderType } from "@giz/file-renderer";
import { createLogger } from "@giz/logging";
import { SearchQueryType } from "@giz/query";
import { getStringDate, GizDate } from "@giz/utils/gizdate";

import { EvaluatedRange, evaluateTimeRange, QueryError, QueryWithErrors } from "./query";

export type Metrics = typeof Maestro.prototype.metrics;
export type State = typeof Maestro.prototype.state;

export type TimeMode = "rangeByDate" | "rangeByRef" | "sinceFirstCommitBy";

export type FileMode =
  | "pattern"
  | "filePicker"
  | "lastEditedBy"
  | "editedBy"
  | "createdBy"
  | "changedInRef";

export type ObjectChangeEventArguments<O extends {}> = [
  {
    changedKeys: string[];
    oldValue?: O;
    newValue: O;
  },
];

export type ObjectReplaceEventArguments<O extends {}> = [
  {
    oldValue?: O;
    newValue: O;
  },
];

export type ChangeEventArguments<P extends string | number | boolean | any> = [
  {
    oldValue?: P;
    newValue: P;
  },
];

export type Events = {
  "state:updated": ObjectChangeEventArguments<State>;
  "metrics:updated": ObjectChangeEventArguments<Metrics>;

  "query:updated": [QueryWithErrors];
  "visualization-settings:updated": ObjectReplaceEventArguments<VisualizationSettings>;

  "device-pixel-ratio:updated": ChangeEventArguments<number>;

  "selected-files:updated": ChangeEventArguments<FileTreeNode[]>;
  "available-files:updated": ChangeEventArguments<FileTreeNode[]>;
  "blocks:updated": [Block[]];
  "block:updated": [id: string, data: BlockImage];
  "block:removed": [id: string];
};

export type MaestroOpts = {
  devicePixelRatio: number;
  visualizationSettings?: VisualizationSettings;
  explorerPool?: PoolPortal;
};

export class Maestro extends EventEmitter<Events, Maestro> {
  private logger = createLogger("maestro");
  private explorerPool!: PoolPortal;
  private explorerPoolController!: PoolController;
  private renderPool: FileRendererPool;
  private db: Database;

  private needsRerender = false;
  private requiredDpr = 1;

  constructor(opts: MaestroOpts) {
    super();
    this.renderPool = new FileRendererPool();
    if (opts.explorerPool) {
      this.explorerPool = opts.explorerPool;
    }

    this.devicePixelRatio = opts.devicePixelRatio;
    if (opts.visualizationSettings) {
      this.visualizationSettings = opts.visualizationSettings;
    }
    this.db = new Database();
  }

  setScale = (scale: number) => {
    let dpr = 1;

    if (scale > 2.8) {
      dpr = 3.5;
    } else if (scale > 1.5) {
      dpr = 2.5;
    } else if (scale > 1) {
      dpr = 2;
    }

    const changed = this.requiredDpr !== dpr;
    if (changed) {
      this.requiredDpr = dpr;
      this.scheduleAllBlockRenders();
    }
  };

  checkNeedsRerender = () => {
    if (this.needsRerender) {
      this.needsRerender = false;
      this.scheduleAllBlockRenders();
    }
  };

  setNeedsRerender = () => {
    this.needsRerender = true;
  };

  setup = async (opts: PoolControllerOpts) => {
    this.updateState({ screen: "initial-load" });
    this.explorerPoolController = await PoolController.create(opts);
    const port = await this.explorerPoolController.createPort();
    this.explorerPool = new PoolPortal(port);

    this.explorerPoolController.on("metrics-update", (metrics) => {
      this.updateMetrics({
        numExplorerWorkersTotal: metrics.numTotalWorkers,
        numExplorerWorkersBusy: metrics.numBusyWorkers,
        numExplorerJobs: metrics.numJobsInQueue,
      });
    });

    autorun(
      () => {
        this.updateMetrics({
          numRendererWorkers: this.renderPool.numWorkers,
          numRendererWorkersBusy: this.renderPool.numBusyWorkers,
          numRendererJobs: this.renderPool.numJobsInQueue,
        });
      },
      { delay: 200 },
    );

    const dbPort = await this.explorerPoolController.createPort();

    this.db.init(dbPort).then(() => {
      this.updateState({
        authorsLoaded: true,
      });
      this.db.countAuthors().then((count) => {
        this.db.queryAuthors(0, count).then((authors) => {
          this.cachedAuthors = authors;
          this.colorManager.init({ domain: authors.map((a) => a.id) });
        });
      });
    });

    await this.setInitialQuery();
    this.updateState({ repoLoaded: true, screen: "main" });

    return this.explorerPoolController;
  };

  getDefaultRangeByDate = () => {
    if (this.range) {
      return [getStringDate(this.range.since.date), getStringDate(this.range.until.date)];
    }

    const endDate = new GizDate(this.state.lastCommitTimestamp * 1000);
    const startDate = endDate.subtractDays(365);
    return [getStringDate(startDate), getStringDate(endDate)];
  };

  getDefaultRangeByRef = async () => {
    if (this.range) {
      return [this.range.since.commit.oid, this.range.until.commit.oid];
    }

    return ["", ""];
  };

  setInitialQuery = async () => {
    const { branches, currentBranch, remotes, tags } =
      await this.explorerPool.execute<InitialDataResult>("get_initial_data", {}).promise;

    const headCommit = await this.explorerPool.getCommit({ rev: "HEAD" });

    // TODO: determine name of repo from remote urls if possible

    this.updateState({
      lastCommitTimestamp: +headCommit.timestamp,
      lastCommitAuthorId: headCommit.aid,
      currentBranch,
      branches,
      remotes,
      tags,
    });

    this.logger.log({
      branches,
      remotes,
      tags,
      lastCommit: headCommit,
      currentBranch,
      initialrange: this.getDefaultRangeByDate(),
    });

    const query: SearchQueryType = {
      branch: currentBranch,
      type: "file-lines",
      time: {
        rangeByDate: this.getDefaultRangeByDate(),
      },
      files: {
        changedInRef: currentBranch,
      },
      preset: {
        gradientByAge: [
          this.visualizationSettings.colors.old.value,
          this.visualizationSettings.colors.new.value,
        ],
      },
    };
    await this.updateQuery(query);
  };

  // ------------------- Metrics -------------------

  metrics = {
    numSelectedFiles: 0,
    numExplorerWorkersTotal: 0,
    numExplorerWorkersBusy: 0,
    numExplorerJobs: 0,

    numRendererWorkers: 0,
    numRendererWorkersBusy: 0,
    numRendererJobs: 0,
  };

  updateMetrics = (metrics: Partial<Metrics>) => {
    const oldMetrics = { ...this.metrics };
    this.metrics = { ...this.metrics, ...metrics };
    this.emit("metrics:updated", {
      changedKeys: [] as const, // TODO
      oldValue: oldMetrics,
      newValue: this.metrics,
    });
  };

  // ---------------------------------------------
  // ------------------- State -------------------
  // ---------------------------------------------

  state = {
    screen: "welcome" as "welcome" | "initial-load" | "main",
    queryValid: false,
    repoLoaded: false,
    authorsLoaded: false,
    commitsIndexed: false,
    filesIndexed: false,
    error: undefined as string | undefined,

    lastCommitTimestamp: 0,
    lastCommitAuthorId: "",
    currentBranch: "",

    tags: [] as string[],
    branches: [] as string[],

    /**
     * The remotes of the repository.
     * Is currently only populated in explorer-node.
     * TODO: Stefan
     */
    remotes: [] as { name: string; url: string }[],
  };

  updateState = (state: Partial<State>) => {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...state };

    const hasChanged = !isEqual(oldState, this.state);

    if (!hasChanged) {
      return;
    }

    this.emit("state:updated", {
      changedKeys: [] as const, // TODO
      oldValue: oldState,
      newValue: this.state,
    });
  };

  setError = (error: unknown) => {
    const errorString = error instanceof Error ? error.toString() : JSON.stringify(error);
    this.updateState({ error: errorString });
  };

  resetError = () => {
    this.updateState({ error: undefined });
  };

  untilState<K extends keyof State>(key: K, value: State[K]) {
    if (this.state[key] === value) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const listener = () => {
        if (this.state[key] === value) {
          this.off("state:updated", listener);
          resolve();
        }
      };
      this.on("state:updated", listener);
    });
  }
  // ---------------------------------------------
  // ------------------- Query -------------------
  // ---------------------------------------------

  range!: EvaluatedRange;

  query: SearchQueryType = {
    branch: "",
    type: "file-lines",
    time: {
      rangeByRef: "HEAD",
    },
    files: {
      changedInRef: "HEAD",
    },
    preset: {
      gradientByAge: ["#EFEFEF", "#EFEFEF"],
    },
  };

  queryErrors: QueryError[] = [];

  /**
   * A unique key for the current query as a shortened string-concatenation of all query parameters.
   */
  private renderCacheKey = "";

  private updateQueryCacheKey() {
    let keyReplacements: Record<string, string> = {
      branch: "b",
      type: "t",
      "time.rangeByDate": "trbd",
      "time.rangeByRef": "trbr",
      "time.sinceFirstCommitBy": "tsfcb",
      "preset.gradientByAge": "pgba",
      "preset.paletteByAuthor": "ppba",
    };

    if (this.query.type !== "file-lines" && this.query.type !== "file-mosaic") {
      // Rerenders are only required if the file selection changes for queries other than file-lines / file-mosaic
      // TODO: recheck this as soon as we support other block types
      keyReplacements = {
        ...keyReplacements,
        "files.path": "fp",
        "files.lastEditedBy": "fleb",
        "files.editedBy": "feb",
        "files.createdBy": "fcb",
        "files.contains": "fc",
        "files.changedInRef": "fcir",
      };
    }

    const keyValueDelimiter = "=";
    const pairDelimiter = "&";

    const query = this.query;

    const queryCacheParts: string[] = [];
    for (const [key1, key2] of Object.entries(keyReplacements)) {
      let value = result(query, key1);
      if (!value) {
        continue;
      }
      if (key1 === "files.path" && Array.isArray(value)) {
        value = simpleHash(value.join(","));
      } else if (Array.isArray(value)) {
        value = `[${value.join(",")}]`;
      } else {
        value = value.toString();
      }
      queryCacheParts.push([key2, value].join(keyValueDelimiter));
    }

    // TODO: Extend this
    queryCacheParts.push(
      this.visualizationSettings.colors.old.value,
      this.visualizationSettings.colors.new.value,
      this.visualizationSettings.colors.notLoaded.value,
    );

    this.renderCacheKey = queryCacheParts.join(pairDelimiter);
  }

  setTimeMode = async (mode: string | TimeMode) => {
    switch (mode) {
      case "rangeByDate": {
        this.updateQuery({ time: { rangeByDate: this.getDefaultRangeByDate() } });
        break;
      }
      case "rangeByRef": {
        const rangeByRef = await this.getDefaultRangeByRef();
        this.updateQuery({ time: { rangeByRef } });
        break;
      }
      case "sinceFirstCommitBy": {
        this.updateQuery({ time: { sinceFirstCommitBy: "" } });
        break;
      }
      default: {
        throw new Error("Unsupported time mode");
      }
    }
  };

  updateQuery = async (partialQuery: Partial<SearchQueryType>) => {
    const oldQuery = { ...this.query };
    const query = { ...this.query, ...partialQuery };
    this.query = query;
    const hasChanged = !isEqual(oldQuery, this.query);

    if (!hasChanged) {
      return;
    }

    const hadErrors = this.queryErrors.length > 0;

    this.queryErrors = [];

    // validate query.time.* fields
    if (
      hadErrors ||
      !isEqual(query.time, oldQuery.time) ||
      !isEqual(query.branch, oldQuery.branch)
    ) {
      const { result, errors } = await evaluateTimeRange(
        this.query.time,
        this.explorerPool,
        this.query.branch,
      );

      if (errors) {
        this.queryErrors.push(...errors);
      } else {
        this.range = result;
      }
    }

    // validate query.files.* fields
    if (
      (hadErrors || !isEqual(query.files, oldQuery.files)) &&
      query.files &&
      "changedInRef" in query.files &&
      typeof query.files.changedInRef === "string"
    ) {
      const valid = await this.explorerPool.isValidRev({ rev: query.files.changedInRef });
      if (!valid) {
        this.queryErrors.push({
          selector: "files.changedInRef",
          message: "Invalid ref",
        });
      }
    }

    this.emit("query:updated", {
      query: this.query,
      errors: this.queryErrors,
    });

    if (this.queryErrors.length > 0) {
      return;
    }

    if (
      !isEqual(query.preset, oldQuery.preset) &&
      query.preset &&
      "paletteByAuthor" in query.preset
    ) {
      this.colorManager.init({ assignedColors: query.preset.paletteByAuthor });
    }

    if (
      !isEqual(query.preset, oldQuery.preset) &&
      query.preset &&
      "gradientByAge" in query.preset
    ) {
      this.colorManager.init({ assignedColors: [] });
    }

    this.updateQueryCacheKey();

    if (
      !isEqual(query.branch, oldQuery.branch) ||
      !isEqual(query.time, oldQuery.time) ||
      !isEqual(query.type, oldQuery.type) ||
      !isEqual(query.preset, oldQuery.preset) ||
      !isEqual(query.files, oldQuery.files)
    ) {
      this.setNeedsRerender();
    }

    // Refresh the available files but we do not await it
    this.safeRefreshAvailableFiles(oldQuery);
  };

  // ---------------------------------------------
  // -------------- AvailableFiles ---------------
  // ---------------------------------------------

  availableFiles: FileTreeNode[] | undefined = undefined;

  private safeRefreshAvailableFiles = async (oldQuery?: SearchQueryType) => {
    try {
      await this.refreshAvailableFiles(oldQuery);
    } catch (error) {
      console.error("Error while refreshing available files", error);
      this.setError(error);
    }
    this.safeRefreshSelectedFiles();
  };

  private refreshAvailableFiles = async (oldQuery?: SearchQueryType) => {
    const { branch, time, type, preset } = this.query;
    if (!type) {
      this.reset();
      return;
    }

    const typeChanged = !isEqual(type, oldQuery?.type);
    const presetChanged = !isEqual(preset, oldQuery?.preset);
    const timeChanged = !isEqual(time, oldQuery?.time);
    const branchChanged = branch !== oldQuery?.branch;
    const initial = !this.availableFiles || !oldQuery;

    if (typeChanged || branchChanged || timeChanged || presetChanged || initial) {
      const tree = await this.explorerPool!.getFileTree({
        rev: this.range.until.commit.oid,
      });

      const oldFiles = this.availableFiles;
      this.availableFiles = tree
        .sort((a, b) => {
          if (a.kind === "folder" && b.kind !== "folder") return -1; // Sort folders before files
          if (a.kind !== "folder" && b.kind === "folder") return 1; // Sort folders before files

          return a.path.length - b.path.length;
        })
        .filter((f) => f.path.length > 0);

      this.emit("available-files:updated", {
        oldValue: oldFiles,
        newValue: this.availableFiles,
      });
    }
  };

  // ---------------------------------------------
  // -------------- SelectedFiles ----------------
  // ---------------------------------------------

  selectedFiles: FileTreeNode[] = [];

  safeRefreshSelectedFiles = async () => {
    try {
      await this.refreshSelectedFiles();
    } catch (error) {
      console.error("Error while refreshing selected files", error);
      this.setError(error);
    }

    // Refresh the blocks but we do not await it
    this.safeRefreshBlocks();
  };

  refreshSelectedFiles = async () => {
    const { files } = this.query;
    if (!files) {
      this.selectedFiles = [];
      return;
    }

    const selectedFiles = await match(files)
      .with({ path: Pattern.string }, (f) => {
        // select files by path glob (one or multiple)
        const globPatterns = [f.path];

        if (!this.availableFiles) {
          return [];
        }

        return this.availableFiles.filter((node) => {
          if (node.kind === "folder") {
            return false;
          }
          const result = globPatterns.some((p) =>
            minimatch(node.path.join("/"), p, { matchBase: true }),
          );
          return result;
        });
      })
      .with({ path: Pattern.array(Pattern.string) }, (f) => {
        // select files by path array (one or multiple)
        const paths = f.path;

        if (!this.availableFiles) {
          return [];
        }

        return this.availableFiles.filter((node) => {
          if (node.kind === "folder") {
            return false;
          }
          const result = paths.includes(node.path.join("/"));
          return result;
        });
      })
      .with({ lastEditedBy: Pattern._ }, (_f) => {
        // select files by last edited by
        throw new Error("Unsupported file selection");
      })
      .with({ editedBy: Pattern._ }, (_f) => {
        throw new Error("Unsupported file selection");
      })
      .with({ createdBy: Pattern._ }, (_f) => {
        throw new Error("Unsupported file selection");
      })
      .with({ changedInRef: Pattern.string }, async ({ changedInRef }) => {
        const commit = await this.explorerPool.getCommit({ rev: changedInRef });

        const paths = new Set([
          ...commit.files.added,
          ...commit.files.modified,
          ...commit.files.deleted,
          ...commit.files.renamed.map((file) => file[1]),
        ]);

        return this.availableFiles!.filter((node) => {
          if (node.kind === "folder") {
            return false;
          }
          const result = paths.has(node.path.join("/"));
          return result;
        });
      })
      .with({ contains: Pattern._ }, (_f) => {
        throw new Error("Unsupported file selection");
      })
      .otherwise(() => {
        throw new Error("Unsupported file selection");
      });

    if (!selectedFiles) {
      return;
    }

    if (isEqual(selectedFiles, this.selectedFiles)) {
      return;
    }

    this.updateMetrics({ numSelectedFiles: selectedFiles.length });

    const oldSelectedFiles = this.selectedFiles;
    this.selectedFiles = selectedFiles;
    this.emit("selected-files:updated", {
      oldValue: oldSelectedFiles,
      newValue: this.selectedFiles,
    });
  };

  // ---------------------------------------------
  // ------------------ Blocks -------------------
  // ---------------------------------------------

  blocks: BlockEntry[] = [];

  get serializableBlocks() {
    return this.blocks.map((b) => serializableBlock(b));
  }

  resetAllBlocks = () => {
    for (const block of this.blocks) {
      this.resetBlock(block);
    }
    this.blocks = [];
  };

  resetBlock = (block: BlockEntry) => {
    const blockIndex = this.blocks.findIndex((b) => b == block);
    if (!blockIndex) {
      return;
    }

    if (block.url) {
      URL.revokeObjectURL(block.url);
      block.url = undefined;
    }

    if (block.blameJobRef) {
      block.blameJobRef.cancel();
      block.blameJobRef = undefined;
    }
    this.emit("block:removed", block.id);

    this.blocks = this.blocks.splice(blockIndex, 1);
  };

  safeRefreshBlocks = async () => {
    try {
      await this.refreshBlocks();
    } catch (error) {
      console.error("Error while refreshing blocks", error);
      this.setError(error);
    }
    this.checkNeedsRerender();
  };

  refreshBlocks = async () => {
    const { type } = this.query;
    if (!type || !this.selectedFiles || this.selectedFiles.length === 0) {
      this.resetAllBlocks();
      this.emit(
        "blocks:updated",
        this.blocks.map((b) => serializableBlock(b)),
      );
      return;
    }

    const blocks = await match(type)
      .with(Pattern.union("file-lines", "file-mosaic"), async (t) => {
        const fileContents = await Promise.all(
          this.selectedFiles.map((file) => this.getFileContent(file.path.join("/"))),
        );

        return this.selectedFiles.map((file, index): Block => {
          const numLines = fileContents[index].split("\n").length;
          const blockHeight = match(type)
            .with("file-lines", () => (numLines - 1) * 10)
            .with("file-mosaic", () => Math.max((Math.floor(numLines / 10) + 1) * 10, 10))
            .otherwise(() => {
              throw new Error("Unsupported block type (height calculation)");
            });

          return {
            id: `${t}:${file.path.join("/")}`,
            type: t,
            filePath: file.path.join("/"),
            fileType: isNumber(file.kind) ? getFileIcon(file.kind) : undefined,
            height: blockHeight,
          };
        });
      })
      .with("author-mosaic", () => {
        throw new Error("Unsupported block type");
      })
      .with("author-contributions", () => {
        throw new Error("Unsupported block type");
      })
      .otherwise(() => {
        throw new Error("Unsupported block type");
      });

    if (!blocks) {
      return;
    }

    const toDelete = differenceBy(this.blocks, blocks, "id");

    const toAdd = differenceBy(blocks, this.blocks, "id");

    // Update existing
    for (const block of blocks) {
      const existingBlock = this.blocks.find((b) => b.id === block.id);
      if (existingBlock && existingBlock.height !== block.height) {
        existingBlock.height = block.height;
        existingBlock.currentImageCacheKey = undefined; // force rerender
        this.setNeedsRerender();
      }
    }

    // remove deleted blocks
    this.blocks = this.blocks.filter((b) => !toDelete.includes(b));

    // add new blocks
    this.blocks.push(...toAdd.map((b) => ({ ...b, dpr: 0 })));

    if (toAdd.length > 0) {
      this.setNeedsRerender();
    }

    this.emit(
      "blocks:updated",
      this.blocks.map((b) => serializableBlock(b)),
    );
  };

  setBlockInView = (id: string, inView: boolean) => {
    const block = this.blocks.find((b) => b.id === id);
    if (!block) {
      return;
    }
    const changed = block.inView !== inView;
    block.inView = inView;
    if (changed) this.scheduleBlockRender(id);
  };

  getBlockImage = (id: string): BlockImage => {
    const block = this.blocks.find((b) => b.id === id);
    if (!block) {
      return {};
    }
    return {
      url: block.url,
      isPreview: block.isPreview,
    };
  };

  scheduleAllBlockRenders = () => {
    for (const block of this.blocks) {
      this.scheduleBlockRender(block.id);
    }
  };

  scheduleBlockRender = async (id: string) => {
    const block = this.blocks.find((b) => b.id === id);
    if (!block) {
      throw new Error("Block not found");
    }

    const {
      query,
      explorerPool,
      renderPool,
      visualizationSettings,
      renderCacheKey,
      range,
      colorManager,
    } = this;

    let { requiredDpr } = this;

    let showContent = true;

    if (block.height > 10_000) {
      requiredDpr = 1;
      showContent = false;
    }

    if (!block.inView) {
      requiredDpr = 1;
    }

    if (!block.inView && !block.blameJobRef) {
      return;
    }

    if (block.currentImageCacheKey === renderCacheKey && block.dpr === requiredDpr) {
      // Already rendered
      return;
    }

    match(block.type)
      .with(Pattern.union("file-lines", "file-mosaic"), () => {})
      .otherwise(() => {
        throw new Error("Unsupported block type");
      });

    if (!block.blameJobRef || block.currentImageCacheKey !== renderCacheKey) {
      block.blameJobRef = explorerPool!.getBlame(
        {
          rev: range.until.commit.oid,
          path: block.filePath,
          preview: false,
          sinceRev: range.since.commit.oid,
        },
        10,
      ) as any;
    }

    const blame = await block.blameJobRef!.promise;

    const currentCacheKey = renderCacheKey;
    block.upcomingImageCacheKey = currentCacheKey;

    const lines = parseLines(blame);

    const selectedStartDate = this.range.since.date;
    const selectedEndDate = this.range.until.date;

    if (lines.length === 0) {
      return;
    }
    const visualizationConfig: VisualizationConfig = {
      colors: {
        newest: visualizationSettings.colors.new.value,
        oldest: visualizationSettings.colors.old.value,
        notLoaded: visualizationSettings.colors.notLoaded.value,
      },
      style: {
        lineLength: visualizationSettings.style.lineLength.value,
      },
    };

    let coloringMode: "age" | "author" = "age";

    if (query.preset && "gradientByAge" in query.preset) {
      visualizationConfig.colors.oldest = query.preset.gradientByAge[0];
      visualizationConfig.colors.newest = query.preset.gradientByAge[1];
    } else if (query.preset && "paletteByAuthor" in query.preset) {
      coloringMode = "author";
    }

    const baseCtx: BaseContext = {
      dpr: requiredDpr,
      earliestTimestamp: selectedStartDate.getTime() / 1000, // TODO: should be removed
      latestTimestamp: selectedEndDate.getTime() / 1000, // TODO: should be removed
      selectedStartDate,
      selectedEndDate,
      rect: new DOMRect(0, 0, 300, lines.length * 10),
      isPreview: false,
      visualizationConfig,
    };

    const { result } = await match(query.type)
      .with("file-lines", async () => {
        return renderPool.renderCanvas({
          ...baseCtx,
          type: RenderType.FileLines,
          fileContent: lines,
          lineLengthMax: 120,
          coloringMode,
          showContent,
          rect: new DOMRect(0, 0, 300, lines.length * 10),
          colorDefinition: colorManager.state,
        });
      })
      .with("file-mosaic", async () => {
        return renderPool.renderCanvas({
          ...baseCtx,
          type: RenderType.FileMosaic,
          tilesPerRow: 10,
          fileContent: lines,
          coloringMode,
          selectedStartDate,
          selectedEndDate,
          rect: new DOMRect(0, 0, 300, lines.length),
          colorDefinition: colorManager.state,
        });
      })
      .otherwise(() => {
        throw new Error("Unsupported render type.");
      });

    if (block.url) {
      URL.revokeObjectURL(block.url);
      block.url = undefined;
    }

    block.url = result;
    block.currentImageCacheKey = currentCacheKey;
    block.upcomingImageCacheKey = undefined;
    block.dpr = requiredDpr;

    this.emit("block:updated", id, {
      url: result,
      isPreview: false,
    });
  };

  // ---------------------------------------------
  // -------------- Author List ------------------
  // ---------------------------------------------

  cachedAuthors: Author[] = [];

  async getAuthorCount(): Promise<number> {
    await this.untilState("authorsLoaded", true);
    return await this.db.countAuthors();
  }

  async getAuthors(offset: number, limit?: number): Promise<(Author & { color: string })[]> {
    await this.untilState("authorsLoaded", true);

    if (!limit) {
      limit = this.cachedAuthors.length;
    }

    const authors = await this.db.queryAuthors(offset, limit);
    return authors.map((a) => {
      const color = this.colorManager.getBandColor(a.id);
      return { ...a, color };
    });
  }

  // ---------------------------------------------
  // -------------- File Content -----------------
  // ---------------------------------------------

  async getFileContent(path: string): Promise<string> {
    return this.explorerPool!.getFileContent({
      rev: this.range.until.commit.oid,
      path,
    });
  }

  // ---------------------------------------------
  // ---------- Visualization Settings -----------
  // ---------------------------------------------

  visualizationSettings: VisualizationSettings = {} as any;

  updateVisualizationSettings = (settings: VisualizationSettings) => {
    const oldSettings = this.visualizationSettings;
    this.visualizationSettings = settings;
    this.emit("visualization-settings:updated", {
      oldValue: oldSettings,
      newValue: this.visualizationSettings,
    });

    this.updateQueryCacheKey();
    this.scheduleAllBlockRenders();
  };

  // ---------------------------------------------
  // --------------- Color Manager ---------------
  // ---------------------------------------------

  colorManager: ColorManager = new ColorManager();

  // ---------------------------------------------
  // ------------------- Other -------------------
  // ---------------------------------------------

  /**
   * The device pixel ratio of the client, required for rendering.
   * This is needed because in a Web Worker, `window.devicePixelRatio` is not available.
   * This value can be updated even after the worker is initialized.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
   */
  devicePixelRatio = 1;

  updateDevicePixelRatio = (devicePixelRatio: number) => {
    const oldDevicePixelRatio = this.devicePixelRatio;
    this.devicePixelRatio = devicePixelRatio;
    this.emit("device-pixel-ratio:updated", {
      oldValue: oldDevicePixelRatio,
      newValue: this.devicePixelRatio,
    });
    this.scheduleAllBlockRenders();
  };

  // ---------------------------------------------

  private reset() {
    // clear blocks
    // clear selected files
    // TODO
    throw new Error("Not implemented");
  }

  debugPrint() {
    if (this.explorerPoolController) {
      this.explorerPoolController.debugPrint();
    }

    console.log("Maestro", this);

    console.log("Metrics", this.metrics);
    console.log("State", this.state);

    console.log("Query", this.query);
    console.log("Available Files", this.availableFiles);
    console.log("Selected Files", this.selectedFiles);

    console.log("Blocks", this.blocks);
  }

  emit<T extends keyof Events>(
    event: T,
    ...args: EventEmitter.ArgumentMap<Events>[Extract<T, keyof Events>]
  ): boolean {
    this.logger.log("emit", event, ...args);
    return super.emit(event, ...args);
  }
}

export type BaseBlock = {
  id: string;
  height: number;
};

export type FileLinesBlock = BaseBlock & {
  type: "file-lines";
  filePath: string;
  fileType?: FileIcon | undefined;
};

export type FileMosaicBlock = BaseBlock & {
  type: "file-mosaic";
  filePath: string;
  fileType?: FileIcon | undefined;
};

export type AuthorMosaicBlock = BaseBlock & {
  type: "author-mosaic";
  authorName: string;
  authorEmail: string;
  authorGravatarHash: string;
};

export type AuthorContributionsBlock = BaseBlock & {
  type: "author-contributions";
  authorName: string;
  authorEmail: string;
  authorGravatarHash: string;
};

export type Block = FileLinesBlock | FileMosaicBlock | AuthorMosaicBlock | AuthorContributionsBlock;
export type BlockImage = {
  url?: string;
  isPreview?: boolean;
};

type BlockEntry = Block & {
  url?: string;
  isPreview?: boolean;

  // internal
  currentImageCacheKey?: string;
  upcomingImageCacheKey?: string;
  inView?: boolean;
  dpr: number;
  blameJobRef?: JobRef<Blame>;
};

function serializableBlock(block: BlockEntry): Block {
  return omit(block, [
    "blameJobRef",
    "dpr",
    "priority",
    "currentImageCacheKey",
    "upcomingImageCacheKey",
  ]) as Block;
}

// ---------------------------------------------
// ------------------ Helpers ------------------
// ---------------------------------------------

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

  return lines;
}

/**
 * Source: https://gist.github.com/jlevy/c246006675becc446360a798e2b2d781?permalink_comment_id=4738050#gistcomment-4738050
 * A simple and insecure hash function for strings, used to generate a unique key for the currently selected files-list.
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = Math.trunc((hash << 5) - hash + (input.codePointAt(i) ?? 0));
  }
  return (hash >>> 0).toString(36);
}
