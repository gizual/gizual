import type { VisualizationSettings } from "@app/controllers";
import { Remote, transfer, wrap } from "comlink";
import { makeObservable, observable, runInAction } from "mobx";

import { PoolControllerOpts } from "@giz/explorer-web";
import { importDirectoryEntry, importFromFileList, importZipFile, seekRepo } from "@giz/opfs";
import { webWorkerLink } from "@giz/trpc-webworker/link";
import { GizWorker } from "@giz/worker";
// TODO: remove this
import type { MainController } from "../../../apps/gizual-app/src/controllers/main.controller";

import type { MaestroWorker } from "./maestro-worker";
import MaestroWorkerURL from "./maestro-worker?worker&url";

export type RepoSetupOpts = {
  maxConcurrency?: number;
  fileList?: FileList;
  directoryHandle?: FileSystemDirectoryHandle;
  directoryEntry?: FileSystemDirectoryEntry;
  zipFile?: File;
};
import EventEmitter from "eventemitter3";

import { createLogger } from "@giz/logging";

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
};

export class Maestro extends EventEmitter<MaestroEvents> {
  logger = createLogger("maestro");
  rawWorker!: Worker;
  worker!: Remote<MaestroWorker>;
  link!: ReturnType<typeof webWorkerLink>[0];
  dispose!: () => void;

  // TODO: remove observability
  @observable state: "init" | "ready" | "loading" = "init";
  @observable progressText = "";

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

    this.setupDevicePixelRatioListener();
  }

  async setup() {
    const { trpcPort } = await this.worker.setup({
      devicePixelRatio: window.devicePixelRatio,
    });

    const [link, dispose] = webWorkerLink({ port: trpcPort });

    this.link = link;
    this.dispose = dispose;
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
      console.error(error);
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
          this.progressText = `${progress.state}: ${progress.numProcessed}/${progress.numTotal} (${progress.progress}%)`;
        });
      },
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
}
