import { Remote, transfer, wrap } from "comlink";
import { makeAutoObservable, toJS } from "mobx";
import React from "react";

import { BlameView } from "@giz/explorer";
import { CommitInfo } from "@giz/explorer";
import { MainController } from "../../controllers";

import { CanvasWorker } from "./worker/worker";

export type FileInfo = {
  fileName: string;
  fileExtension: string;
  fileContent: Line[];
  lineLengthMax: number;

  earliestTimestamp: number;
  latestTimestamp: number;
};

//export type Commit = {
//  hash: string;
//  timestamp: number;
//};

export type Line = {
  content: string;
  commit?: CommitInfo;
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
  _colors: string[] = [];

  _canvasRef: React.RefObject<HTMLCanvasElement> | undefined;
  _fileRef: React.RefObject<HTMLDivElement> | undefined;
  _canvasWorker?: Remote<CanvasWorker>;
  _worker?: Worker;
  _redrawCount = 0;
  _lastDrawScale = 1;
  _lastDrawnColorMode?: MainController["coloringMode"] = "By Age";

  constructor(
    mainController: MainController,
    path: string,
    settings: Settings,
    isFavourite?: boolean,
    isLoadIndicator?: boolean,
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

  dispose() {
    this._worker?.terminate();
  }

  close() {
    this._mainController.toggleFile(this._fileName);
    this._blameView.dispose();
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

  get isValid() {
    return (
      this._blameView.blame && this._blameView.blame.lines && this._blameView.blame.lines.length > 0
    );
  }

  get blameInfo() {
    const blame = this._blameView.blame;

    let lenMax = 0;

    const fileContent: Line[] = blame.lines.map((l) => {
      const commit = toJS(blame.commits[l.commitId]);

      lenMax = Math.max(l.content.length, lenMax);
      return {
        content: l.content,
        commit,
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

  setColors(colors: string[]) {
    this._colors = colors;
  }

  get colors() {
    return this._colors;
  }

  get canvasWorker() {
    return this._canvasWorker;
  }

  setCanvasWorker(worker: Remote<CanvasWorker>) {
    this._canvasWorker = worker;
  }

  setWorker(worker: Worker) {
    this._worker = worker;
  }

  get shouldRedraw() {
    return (
      this.lastDrawScale - this._mainController.scale < -0.25 ||
      this.lastDrawnColorMode !== this._mainController.coloringMode
    );
  }

  setLastDrawScale(scale: number) {
    this._lastDrawScale = scale;
  }

  setLastDrawnColorMode(coloringMode: MainController["coloringMode"]) {
    this._lastDrawnColorMode = coloringMode;
  }

  get lastDrawnColorMode() {
    return this._lastDrawnColorMode;
  }

  get lastDrawScale() {
    return this._lastDrawScale;
  }

  get redrawCount() {
    return this._redrawCount;
  }

  incrementRedrawCount() {
    this._redrawCount++;
  }

  createOrRetrieveCanvasWorker(ref: React.RefObject<HTMLCanvasElement>) {
    if (!this._canvasWorker) {
      const offscreen = toJS(ref).current?.transferControlToOffscreen();
      if (!offscreen) {
        return;
      }
      const worker = new Worker(new URL("worker/worker.ts", import.meta.url), { type: "module" });
      this.setWorker(worker);

      const CanvasWorkerProxy = wrap<CanvasWorker>(worker);
      CanvasWorkerProxy.registerCanvas(transfer(offscreen, [offscreen]));

      this._canvasWorker = CanvasWorkerProxy;
    }

    return this._canvasWorker;
  }

  draw() {
    if (!this._canvasRef || !this._canvasRef.current || !this._fileRef) {
      return;
    }

    const fileContainer = this._fileRef.current;
    if (!fileContainer) {
      return;
    }

    const scale = this._mainController.scale;
    const coloringMode = this._mainController.coloringMode;

    // High resolution displays need different scaling to get the canvas to not appear "blurry"
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays
    const dpr = window.devicePixelRatio * scale * 2;

    const rect = this._canvasRef.current.getBoundingClientRect();
    rect.width = rect.width * (1 / scale);
    rect.height = rect.height * (1 / scale);

    if (this._canvasRef?.current) {
      console.log("Assigning canvas size", rect);
      this._canvasRef.current.style.width = `${rect.width}px`;
      this._canvasRef.current.style.height = `${rect.height}px`;
    }

    const CanvasWorkerProxy = this.createOrRetrieveCanvasWorker(this._canvasRef);
    if (!CanvasWorkerProxy) {
      throw new Error("Could not assign canvas worker");
    }

    console.log("[gizual-app] UI thread: starting worker draw");
    const drawResult = CanvasWorkerProxy.draw({
      authors: this._mainController.authors.map((a) => toJS(a)),
      fileContent: toJS(this.fileContent),
      earliestTimestamp: toJS(this.earliestTimestamp),
      latestTimestamp: toJS(this.latestTimestamp),
      settings: toJS(this._settings),
      lineLengthMax: toJS(this.lineLengthMax),
      dpr,
      rect,
      coloringMode,
      redrawCount: toJS(this.redrawCount),
    });

    drawResult.then((result) => {
      if (!result) return;
      fileContainer.style.width = result.width;
      this.setColors(result.colors);
      console.log("[gizual-app] UI thread: draw result", result);
      this.setLastDrawScale(scale);
      this.setLastDrawnColorMode(coloringMode);
      this.incrementRedrawCount();
    });
  }
}
