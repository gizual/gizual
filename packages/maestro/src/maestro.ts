import type { VisualizationSettings } from "@app/controllers";
import { Remote, transfer, wrap } from "comlink";
import { makeObservable, observable, runInAction } from "mobx";

import { PoolControllerOpts } from "@giz/explorer-web";
import { webWorkerLink } from "@giz/trpc-webworker/link";
// TODO: remove this
import type { MainController } from "../../../apps/gizual-app/src/controllers/main.controller";

import {
  importDirectoryEntry,
  importFromFileList,
  importZipFile,
  printFileTree,
  seekRepo,
} from "./fileio-utils";
import type { MaestroWorker } from "./maestro-worker";
import MaestroWorkerURL from "./maestro-worker?worker&url";

export type RepoSetupOpts = {
  maxConcurrency?: number;
  fileList?: FileList;
  directoryHandle?: FileSystemDirectoryHandle;
  directoryEntry?: FileSystemDirectoryEntry;
  zipFile?: File;
};

declare const mainController: MainController;

export class Maestro {
  rawWorker!: Worker;
  worker!: Remote<MaestroWorker>;
  link!: ReturnType<typeof webWorkerLink>[0];
  dispose!: () => void;

  // TODO: remove observability
  @observable state: "init" | "ready" | "loading" = "init";
  @observable progressText = "";

  constructor() {
    this.updateDevicePixelRatio = this.updateDevicePixelRatio.bind(this);
    console.log("Maestro constructor");

    this.rawWorker = new Worker(MaestroWorkerURL, {
      type: "module",
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

  async openRepoFromURL(service: string, repoName: string) {
    this.state = "loading";

    const sseResponse = new EventSource(`/api/on-demand-clone/${service}/${repoName}`);

    let zipFileName = "";
    const onMessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.type === "snapshot-created") {
        zipFileName = data.snapshotName;
        return;
      }
      if (data.type === "clone-progress") {
        runInAction(() => {
          this.progressText = `${data.state}: ${data.numProcessed}/${data.numTotal} (${data.progress}%)`;
        });
      }
    };

    sseResponse.addEventListener("message", onMessage);

    await new Promise<void>((resolve) => {
      sseResponse.addEventListener("error", (e) => {
        resolve();
      });
    });

    sseResponse.removeEventListener("message", onMessage);
    sseResponse.close();

    runInAction(() => {
      this.progressText = `Downloading ...`;
    });

    if (!zipFileName) {
      runInAction(() => {
        this.progressText = ``;
      });

      this.state = "ready";
      return;
    }

    const response = await fetch(`/api/snapshots/${zipFileName}`);

    const data = await response.arrayBuffer();

    const opts: PoolControllerOpts = {};

    opts.directoryHandle = await importZipFile(data);
    opts.directoryHandle = await seekRepo(opts.directoryHandle!);
    //await printFileTree(opts.directoryHandle!);

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
      opts2.directoryHandle = await importFromFileList(opts.fileList!);
    } else if (opts.directoryEntry) {
      opts2.directoryHandle = await importDirectoryEntry(opts.directoryEntry!);
    } else if (opts.zipFile) {
      if (opts.zipFile.size < 5e7 /* 50 MB */) {
        const zipData = await opts.zipFile!.arrayBuffer();
        const zipDataArray = new Uint8Array(zipData);
        opts2.zipFile = zipDataArray;
      } else {
        opts2.directoryHandle = await importZipFile(await opts.zipFile.arrayBuffer());
      }
    } else if (opts.directoryHandle) {
      opts2.directoryHandle = opts.directoryHandle;
    }

    if (opts2.directoryHandle) {
      opts2.directoryHandle = await seekRepo(opts2.directoryHandle!);
      await printFileTree(opts2.directoryHandle!);
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
