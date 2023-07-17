import { autorun, makeAutoObservable, runInAction, toJS } from "mobx";
import React from "react";

import { MainController } from "../../controllers";
import { wrap, transfer } from "comlink";
import { CanvasWorker } from "./worker/worker";
import { BlameView } from "@giz/explorer";

export type FileInfo = {
  fileName: string;
  fileExtension: string;
  fileContent: Line[];
  lineLengthMax: number;

  earliestTimestamp: number;
  latestTimestamp: number;
};

export type Commit = {
  hash: string;
  timestamp: number;
};

export type Line = {
  content: string;
  commit?: Commit;
  color?: string;
};

export type Settings = Partial<{
  colorOld: string;
  colorNew: string;
  maxLineLength: number;
  lineSpacing: number;
  maxLineCount: number;
}>;

export class FileViewModel {
  _fileName!: string;
  _fileExtension!: string;
  _isFavourite!: boolean;
  _isLoadIndicator!: boolean;
  _settings: Required<Settings>;
  _mainController: MainController;
  _isEditorOpen = false;
  _blameView: BlameView;

  _canvasRef: React.RefObject<HTMLCanvasElement> | undefined;
  _fileRef: React.RefObject<HTMLDivElement> | undefined;

  constructor(
    mainController: MainController,
    path: string,
    settings: Settings,
    isFavourite?: boolean,
    isLoadIndicator?: boolean
  ) {
    this._fileName = path;
    this._isFavourite = isFavourite ?? false;
    this._mainController = mainController;
    this._isLoadIndicator = isLoadIndicator ?? false;
    this._settings = {
      colorNew: "rgb(204, 0, 0)",
      colorOld: "rgb(51, 51, 153)",
      maxLineLength: 120,
      lineSpacing: 0,
      maxLineCount: 60,
      ...settings,
    };
    this._blameView = this._mainController._repo.getBlame(path);

    makeAutoObservable(this);
  }

  close() {
    this._mainController.toggleFile(this._fileName);
  }

  get fileName() {
    return this._fileName;
  }

  get fileExtension() {
    return this._fileExtension;
  }

  get loading() {
    return this._blameView.loading;
  }

  get blameInfo() {
    console.log("getBlameInfo");
    const blame = this._blameView.blame;

    let lenMax = 0;

    const fileContent: Line[] = blame.lines.map((l) => {
      const commit = blame.commits[l.commitId];

      lenMax = Math.max(l.content.length, lenMax);
      return {
        content: l.content,
        commit: {
          hash: commit.commitId,
          timestamp: +commit.timestamp,
        },
      };
    });

    const lineLengthMax = lenMax < 100 ? 100 : lenMax;

    let earliestTimestamp = Number.MAX_SAFE_INTEGER;
    let latestTimestamp = Number.MIN_SAFE_INTEGER;
    for (const commit of Object.values(blame.commits)) {
      earliestTimestamp = Math.min(+commit.timestamp, earliestTimestamp);
      latestTimestamp = Math.max(+commit.timestamp, latestTimestamp);
    }

    return { fileContent, lineLengthMax, earliestTimestamp, latestTimestamp };
  }

  get fileContent() {
    return this.blameInfo.fileContent;
  }

  get latestTimestamp() {
    return this.blameInfo.latestTimestamp;
  }

  get earliestTimestamp() {
    return this.blameInfo.earliestTimestamp;
  }

  get lineLengthMax() {
    return this.blameInfo.lineLengthMax;
  }

  get isFavourite() {
    return this._mainController._favouriteFiles.has(this.fileName);
  }

  setFavourite() {
    this._mainController.toggleFavourite(this._fileName);
  }

  unsetFavourite() {
    this._mainController.toggleFavourite(this._fileName);
  }

  toggleEditor() {
    this._isEditorOpen = !this._isEditorOpen;
    console.log("Toggling editor", this._isEditorOpen);
  }

  get isEditorOpen() {
    return this._isEditorOpen;
  }

  assignCanvasRef(ref: React.RefObject<HTMLCanvasElement>) {
    this._canvasRef = ref;
  }

  assignFileRef(ref: React.RefObject<HTMLDivElement>) {
    this._fileRef = ref;
  }

  get isLoadIndicator() {
    return this._isLoadIndicator;
  }

  draw() {
    if (!this._canvasRef || !this._canvasRef.current || !this._fileRef) {
      return;
    }

    const fileContainer = this._fileRef.current;
    if (!fileContainer) {
      return;
    }

    const offscreen = toJS(this._canvasRef).current?.transferControlToOffscreen();
    if (!offscreen) {
      return;
    }
    const worker = new Worker(new URL("worker/worker.ts", import.meta.url), { type: "module" });

    const CanvasWorkerProxy = wrap<CanvasWorker>(worker);

    console.log("[gizual-app] UI thread: starting worker draw");
    const drawResult = CanvasWorkerProxy.draw(transfer(offscreen, [offscreen]), {
      fileContent: toJS(this.fileContent),
      earliestTimestamp: toJS(this.earliestTimestamp),
      latestTimestamp: toJS(this.latestTimestamp),
      settings: toJS(this._settings),
      lineLengthMax: toJS(this.lineLengthMax),
    });

    drawResult.then((result) => {
      if (!result) return;
      fileContainer.style.width = result.width;
      console.log("[gizual-app] UI thread: draw result", result);
    });
  }
}
