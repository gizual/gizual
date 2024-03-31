import type { VisualizationSettings } from "@app/controllers";
import { Remote, transfer, wrap } from "comlink";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { PoolControllerOpts } from "@giz/explorer-web";
import { importDirectoryEntry, importFromFileList, importZipFile, seekRepo } from "@giz/opfs";
import { GizWorker } from "@giz/worker";
// TODO: remove this
import type { MainController } from "../../../apps/gizual-app/src/controllers/main.controller";

import type { MaestroWorker } from "./maestro-worker";
import type {
  Block,
  MaestroWorkerEvents,
  Metrics,
  SHARED_EVENTS,
  State,
  TimeMode,
} from "./maestro-worker";
import MaestroWorkerURL from "./maestro-worker?worker&url";

export type RepoSetupOpts = {
  maxConcurrency?: number;
  fileList?: FileList;
  directoryHandle?: FileSystemDirectoryHandle;
  directoryEntry?: FileSystemDirectoryEntry;
  zipFile?: File;
};
import EventEmitter from "eventemitter3";
import _debounce from "lodash/debounce";

import { FileTreeNode } from "@giz/explorer";
import { createLogger } from "@giz/logging";

import { Query, QueryError } from "./query-utils";
import { downloadRepo } from "./remote-clone";

declare const mainController: MainController;

export type MaestroEvents = {
  "open:remote-clone": [
    {
      url: string;
      service: string;
      repoName: string;
    },
  ];
  "open:file-input": [
    {
      numFiles: number;
    },
  ];
  "open:drag-drop": [
    {
      name: string;
    },
  ];
  "open:zip": [
    {
      name: string;
      size: number;
    },
  ];
  "open:fsa": [
    {
      name: string;
    },
  ];
} & Pick<MaestroWorkerEvents, SHARED_EVENTS>;

export class Maestro extends EventEmitter<MaestroEvents> {
  logger = createLogger("maestro");
  rawWorker!: Worker;
  worker!: Remote<MaestroWorker>;
  disposers: Array<() => void> = [];

  @observable state: "init" | "ready" | "loading" = "init";
  @observable progressText = "";
  @observable loading = false;

  constructor() {
    super();
    this.updateDevicePixelRatio = this.updateDevicePixelRatio.bind(this);
    this.logger.log("Maestro constructor");

    this.rawWorker = new GizWorker(MaestroWorkerURL, {
      type: "module",
      name: "maestro-worker",
    });

    this.worker = wrap<MaestroWorker>(this.rawWorker);

    this.state = "init";

    makeObservable(this, undefined, { autoBind: true });

    this.setupEventListeners();
  }

  availableFiles = observable.box<FileTreeNode[]>([], { deep: false });
  selectedFiles = observable.box<FileTreeNode[]>([], { deep: false });

  blocks = observable.map<string, Block>([], { deep: true });

  @computed
  get blocksArray() {
    const blocks: Block[] = [];

    for (const [_, value] of this.blocks) {
      blocks.push({
        id: value.id,
        height: value.height,
        type: value.type,
        meta: value.meta,
      } as Block);
    }

    return blocks;
  }

  globalState = observable.box<State>(
    {
      screen: "welcome" as "welcome" | "initial-load" | "main",
      queryValid: false,
      repoLoaded: false,
      authorsLoaded: false,
      commitsIndexed: false,
      filesIndexed: false,
      error: undefined,
      lastCommitTimestamp: 0,
      firstCommitTimestamp: 0,
      lastCommitAuthorId: "",
      currentBranch: "",
      tags: [],
      branches: [],
      remotes: [],
    },
    { deep: false },
  );

  metrics = observable.box<Metrics>(
    {
      numExplorerJobs: 0,
      numExplorerWorkersBusy: 0,
      numExplorerWorkersTotal: 0,
      numRendererJobs: 0,
      numRendererWorkersBusy: 0,
      numRendererWorkers: 0,
      numSelectedFiles: 0,
    },
    { deep: false },
  );

  query = observable.box<Query>({ branch: "", type: "file-lines" }, { deep: false });

  queryErrors = observable.box<QueryError[] | undefined>(undefined, { deep: false });

  @action.bound
  setQuery(query: Query) {
    this.worker.updateQuery(query);
  }

  @action.bound
  updateQuery(query: Partial<Query>) {
    this.worker.updateQuery(query);
  }

  @action.bound
  setTimeMode(mode: TimeMode) {
    this.worker.setTimeMode(mode);
  }

  setScale = _debounce(
    (scale: number) => {
      this.worker.setScale(scale);
    },
    400,
    {
      leading: false,
      trailing: true,
    },
  );

  setBlockInView(id: string, inView: boolean) {
    this.worker.setBlockInView(id, inView);
  }

  getAuthorList = (limit: number, offset: number, search: string) => {
    return this.worker.getAuthorList({
      limit,
      offset,
      search,
    });
  };

  getFileContent = (path: string) => {
    return this.worker.getFileContent(path);
  };

  setupEventListeners() {
    this.setupDevicePixelRatioListener();

    this.on("available-files:updated", ({ newValue }) => {
      runInAction(() => {
        this.availableFiles.set(newValue);
      });
    });

    this.on("selected-files:updated", ({ newValue }) => {
      runInAction(() => {
        this.selectedFiles.set(newValue);
      });
    });

    this.on("metrics:updated", ({ newValue }) => {
      runInAction(() => {
        this.metrics.set(newValue);
        if (newValue.numExplorerWorkersBusy !== undefined) {
          this.loading = newValue.numExplorerWorkersBusy > 0;
        }
      });
    });

    this.on("state:updated", ({ newValue }) => {
      runInAction(() => {
        this.globalState.set(newValue);
      });
    });

    this.on("query:updated", (data) => {
      runInAction(() => {
        this.query.set(data.query);
        this.queryErrors.set(data.errors);
      });
    });

    this.on("blocks:updated", (newValue) => {
      runInAction(() => {
        const newMap = new Map<string, Block>();
        for (const block of newValue) {
          newMap.set(block.id, block);
        }
        this.blocks.replace(newMap);
      });
    });

    this.on("block:updated", (id, value) => {
      runInAction(() => {
        const block = this.blocks.get(id);
        if (!block) {
          this.logger.warn("Block not found", id);
          return;
        }
        Object.assign(block, value);
      });
    });
  }

  async setup() {
    const { port1, port2 } = new MessageChannel();
    await this.worker.init(
      {
        devicePixelRatio: window.devicePixelRatio,
        preferredColorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      },
      transfer(port2, [port2]),
    );

    port1.addEventListener("message", (event) => {
      if (event.data.type) {
        this.emit(event.data.type, ...event.data.payload);
      }
    });

    port1.start();
  }

  async openRepoFromURL(url: string) {
    this.state = "loading";

    try {
      const urlObj = new URL(url);
      let service = urlObj.hostname;
      service = service.replace("www.", "");
      service = service.slice(0, Math.max(0, urlObj.hostname.indexOf(".")));
      const repoName = urlObj.pathname.slice(1);

      this.emit("open:remote-clone", { url, service, repoName });
      await this.openRepoFromUrlUnsafe(service, repoName);
    } catch (error) {
      this.logger.error(error);
      alert(`Error opening repo: ${error}`);
      runInAction(() => {
        this.state = "ready";
        this.progressText = "";
      });
    }
  }

  async openRepoFromUrlUnsafe(service: string, repoName: string) {
    const handle = await downloadRepo({
      service,
      repoName,
      onProgress: (progress) => {
        if (progress.type === "clone-complete") {
          runInAction(() => {
            this.progressText = `Downloading ...`;
          });
          return;
        }

        runInAction(() => {
          this.progressText = `${progress.state}:  ${progress.progress}%`;
        });
      },
    });

    runInAction(() => {
      this.progressText = "";
    });

    const opts: PoolControllerOpts = {};

    opts.directoryHandle = handle;

    const result = await this.worker.setupPool(opts);

    const legacy_explorerPort = result.legacy_explorerPort;

    await mainController.openRepository("?", legacy_explorerPort);

    runInAction(() => {
      this.state = "ready";
      this.progressText = ``;
    });
  }

  async openRepo(opts: RepoSetupOpts) {
    this.state = "loading";

    const opts2: PoolControllerOpts = {
      maxConcurrency: opts.maxConcurrency,
    };

    if (opts.fileList) {
      this.emit("open:file-input", {
        numFiles: opts.fileList.length,
      });
      opts2.directoryHandle = await importFromFileList(opts.fileList!);
    } else if (opts.directoryEntry) {
      this.emit("open:drag-drop", { name: opts.directoryEntry.name });
      opts2.directoryHandle = await importDirectoryEntry(opts.directoryEntry!);
    } else if (opts.zipFile) {
      this.emit("open:zip", { size: opts.zipFile.size, name: opts.zipFile.name });
      if (opts.zipFile.size < 5e7 /* 50 MB */) {
        const zipData = await opts.zipFile!.arrayBuffer();
        const zipDataArray = new Uint8Array(zipData);
        opts2.zipFile = zipDataArray;
      } else {
        opts2.directoryHandle = await importZipFile(await opts.zipFile.arrayBuffer());
      }
    } else if (opts.directoryHandle) {
      this.emit("open:fsa", {
        name: opts.directoryHandle.name,
      });
      opts2.directoryHandle = opts.directoryHandle;
    }

    if (opts2.directoryHandle) {
      opts2.directoryHandle = await seekRepo(opts2.directoryHandle);
      //await printFileTree(opts2.directoryHandle!);
    }

    let legacy_explorerPort: MessagePort;
    if (opts2.directoryHandle) {
      const result = await this.worker.setupPool(opts2);
      legacy_explorerPort = result.legacy_explorerPort;
    } else if (opts2.zipFile) {
      const result = await this.worker.setupPool(transfer(opts2, [opts2.zipFile!.buffer]));
      legacy_explorerPort = result.legacy_explorerPort;
    } else {
      throw new Error("No directory handle or zip file to use");
    }

    // TODO: this is just for legacy reasons to support the old architecture within the main thread
    await mainController.openRepository("?", legacy_explorerPort);

    runInAction(() => {
      this.state = "ready";
    });
  }

  debugPrint() {
    this.worker.debugPrint();
  }

  setupDevicePixelRatioListener() {
    const onChange = () => {
      this.updateDevicePixelRatio(window.devicePixelRatio);
      this.setupDevicePixelRatioListener();
    };

    matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener(
      "change",
      onChange,
      { once: true },
    );
  }

  updateDevicePixelRatio(devicePixelRatio: number) {
    this.worker.setDevicePixelRatio(devicePixelRatio);
  }

  setVisualizationSettings(settings: VisualizationSettings) {
    this.worker.setVisualizationSettings(JSON.parse(JSON.stringify(settings)));
  }

  dispose() {
    for (const dispose of this.disposers) dispose();
    this.disposers = [];
  }
}
