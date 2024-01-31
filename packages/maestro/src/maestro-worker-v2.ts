import { VisualizationSettings } from "@app/controllers";
import { VisualizationConfig } from "@app/types";
import EventEmitter from "eventemitter3";
import { differenceBy, isEqual, isNumber, omit, result } from "lodash";
import { minimatch } from "minimatch";
import { match, Pattern } from "ts-pattern";

import { Database } from "@giz/database";
import {
  Author,
  Blame,
  CommitIds,
  CommitInfo,
  FileTreeNode,
  InitialDataResult,
} from "@giz/explorer";
import {
  FileIcon,
  getFileIcon,
  JobRef,
  PoolController,
  PoolControllerOpts,
  PoolPortal,
} from "@giz/explorer-web";
import { FileRendererPool, RenderType } from "@giz/file-renderer";
import { SearchQueryType } from "@giz/query";
import { getDateFromTimestamp, getStringDate, GizDate } from "@giz/utils/gizdate";

export type Metrics = typeof Maestro.prototype.metrics;
export type State = typeof Maestro.prototype.state;

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

  "query:updated": ObjectReplaceEventArguments<SearchQueryType>;
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

    if (scale > 2.5) {
      dpr = 3.5;
    } else if (scale > 1.5) {
      dpr = 3;
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

    const dbPort = await this.explorerPoolController.createPort();

    this.db.init(dbPort).then(() => {
      this.updateState({
        authorsLoaded: true,
      });
      this.db.countAuthors().then((count) => {
        this.db.queryAuthors(0, count).then((authors) => {
          this.cachedAuthors = authors;
        });
      });
    });

    await this.setInitialQuery();
    this.updateState({ repoLoaded: true, screen: "main" });

    return this.explorerPoolController;
  };

  setInitialQuery = async () => {
    const { lastCommit, branches, currentBranch, remotes, tags } =
      await this.explorerPool.execute<InitialDataResult>("get_initial_data", {}).promise;

    // TODO: determine name of repo from remote urls if possible

    console.log({ branches, remotes, tags });

    this.updateState({
      branches,
      remotes,
      tags,
    });

    const endDate = getDateFromTimestamp(lastCommit.timestamp);

    const startDate = endDate.subtractDays(365);

    const query: SearchQueryType = {
      branch: currentBranch,
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
          this.visualizationSettings.colors.old.defaultValue,
          this.visualizationSettings.colors.new.defaultValue,
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

  range: CommitIds = {
    since_commit_id: "",
    until_commit_id: "",
  };

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

    this.renderCacheKey = queryCacheParts.join(pairDelimiter);
  }

  updateQuery = async (query: Partial<SearchQueryType>) => {
    const oldQuery = { ...this.query };
    this.query = { ...this.query, ...query };

    this.updateQueryCacheKey();

    if (!isEqual(query.time, oldQuery.time) || !isEqual(query.branch, oldQuery.branch)) {
      this.range = await match(query.time)
        .with(QueryPattern.time.rangeByDate, ({ rangeByDate }) => {
          const [startDate, endDate] = resolveRangeByDate(rangeByDate);

          const startSeconds = toSeconds(startDate);
          const endSeconds = toSeconds(endDate);

          return this.explorerPool.getCommitIdsForTimeRange({
            start_seconds: startSeconds,
            end_seconds: endSeconds,
            branch: this.query.branch,
          });
        })
        .with(QueryPattern.time.rangeByRef, ({ rangeByRef }) => {
          return this.explorerPool.getCommitIdsForRefs({
            start_ref: rangeByRef[0],
            end_ref: rangeByRef[1],
          });
        })
        .with(QueryPattern.time.sinceFirstCommitBy, ({ sinceFirstCommitBy: _ }) => {
          throw new Error("Unsupported time range");
        })
        .with(Pattern.nullish, () => {
          throw new Error("Unsupported time range");
        })
        .exhaustive();
    }

    this.emit("query:updated", {
      oldValue: oldQuery,
      newValue: this.query,
    });

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
        rev: this.range.until_commit_id,
      });

      const oldFiles = this.availableFiles;
      this.availableFiles = tree;
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

    const selectedFiles = match(files)
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
      .with({ lastEditedBy: Pattern._ }, (f) => {
        // select files by last edited by
        throw new Error("Unsupported file selection");
      })
      .with({ editedBy: Pattern._ }, (f) => {
        throw new Error("Unsupported file selection");
      })
      .with({ createdBy: Pattern._ }, (f) => {
        throw new Error("Unsupported file selection");
      })
      .with({ changedInRef: Pattern._ }, (f) => {
        throw new Error("Unsupported file selection");
      })
      .with({ contains: Pattern._ }, (f) => {
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
        return this.selectedFiles.map(
          (file, index): Block => ({
            id: `${t}:${file.path.join("/")}`,
            type: t,
            filePath: file.path.join("/"),
            fileType: isNumber(file.kind) ? getFileIcon(file.kind) : undefined,
            height: (fileContents[index].split("\n").length - 1) * 10,
          }),
        );
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

  setBlockPriority = (id: string, priority: number) => {
    const block = this.blocks.find((b) => b.id === id);
    if (!block) {
      return;
    }
    block.priority = priority;
    if (!block.blameJobRef) {
      this.scheduleBlockRender(id);
    }
    block.blameJobRef?.setPriority(priority);
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
    console.log("scheduleAllBlockRenders");
    for (const block of this.blocks) {
      this.scheduleBlockRender(block.id);
    }
  };

  scheduleBlockRender = (id: string) => {
    const block = this.blocks.find((b) => b.id === id);
    if (!block) {
      throw new Error("Block not found");
    }
    const {
      query,
      explorerPool,
      renderPool,
      visualizationSettings,
      cachedAuthors,
      renderCacheKey,
      range,
      requiredDpr,
    } = this;

    if (block.currentImageCacheKey === renderCacheKey && block.dpr === requiredDpr) {
      // Already rendered
      return;
    }

    if (block.blameJobRef) {
      // reschedule blame job
      block.blameJobRef.cancel();
      block.blameJobRef = undefined;
      block.upcomingImageCacheKey = undefined;
    }

    if (block.type !== "file-lines") {
      throw new Error("Unsupported block type");
    }
    const currentCacheKey = renderCacheKey;
    block.upcomingImageCacheKey = currentCacheKey;
    block.blameJobRef = explorerPool!.getBlame(
      {
        rev: range.until_commit_id,
        path: block.filePath,
        preview: false,
      },
      block.priority,
    ) as any;

    block.blameJobRef?.promise
      .then(async (blame) => {
        const lines = parseLines(blame);

        const [selectedStartDate, selectedEndDate] = match(query.time)
          .with(QueryPattern.time.rangeByDate, ({ rangeByDate }) => {
            return resolveRangeByDate(rangeByDate);
          })
          .with(QueryPattern.time.rangeByRef, (t) => {
            throw new Error("Unsupported time range");
          })
          .with(QueryPattern.time.sinceFirstCommitBy, (t) => {
            throw new Error("Unsupported time range");
          })
          .with(Pattern.nullish, () => {
            throw new Error("Unsupported time range");
          })
          .exhaustive();

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

        const { result } = await renderPool.renderCanvas({
          type: RenderType.FileLines,
          fileContent: lines,
          lineLengthMax: 120,
          coloringMode,
          authors: cachedAuthors,
          showContent: true,
          dpr: requiredDpr,
          earliestTimestamp: selectedStartDate.getTime() / 1000, // TODO: should be removed
          latestTimestamp: selectedEndDate.getTime() / 1000, // TODO: should be removed
          selectedStartDate,
          selectedEndDate,
          rect: new DOMRect(0, 0, 300, lines.length * 10),
          isPreview: false,
          visualizationConfig,
        });

        if (block.url) {
          URL.revokeObjectURL(block.url);
          block.url = undefined;
        }

        block.url = result;
        block.blameJobRef = undefined;
        block.currentImageCacheKey = currentCacheKey;
        block.upcomingImageCacheKey = undefined;
        block.dpr = requiredDpr;

        this.emit("block:updated", id, {
          url: result,
          isPreview: false,
        });
      })
      .catch((error) => {
        console.error("Error while rendering block", error);
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

  async getAuthors(offset: number, limit?: number): Promise<Author[]> {
    await this.untilState("authorsLoaded", true);

    if (!limit) {
      limit = this.cachedAuthors.length;
    }

    const authors = await this.db.queryAuthors(offset, limit);
    return authors;
  }

  // ---------------------------------------------
  // -------------- File Content -----------------
  // ---------------------------------------------

  async getFileContent(path: string): Promise<string> {
    return this.explorerPool!.getFileContent({
      rev: this.range.until_commit_id,
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

    this.scheduleAllBlockRenders();
  };

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
    console.log("emit", event, ...args);
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
  priority?: number;
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

function resolveRangeByDate(range: string | string[]): [GizDate, GizDate] {
  if (typeof range === "string") {
    return [new GizDate(range), new GizDate()];
  }

  const startDate = new GizDate(range[0]);
  const endDate = new GizDate(range[1]);

  return [startDate, endDate];
}

function toSeconds(d: GizDate): number {
  return Math.round(d.getTime() / 1000);
}

const QueryPattern = {
  time: {
    rangeByDate: {
      rangeByDate: Pattern.union(Pattern.array(Pattern.string), Pattern.string),
    },

    rangeByRef: {
      rangeByRef: Pattern.union(Pattern.array(Pattern.string), Pattern.string),
    },

    sinceFirstCommitBy: {
      sinceFirstCommitBy: Pattern.string,
    },
  },
};
