import { FileModel, VisualizationDefaults } from "@app/controllers";
import { Remote, wrap } from "comlink";
import { action, computed, makeObservable, observable, toJS } from "mobx";
import React from "react";

import { CommitInfo } from "@giz/explorer";
import { MainController } from "../../controllers";

import { CanvasWorker, FileContext } from "./worker/worker";

export type Line = {
  content: string;
  commit?: CommitInfo;
  color?: string;
};

export type RenderConfiguration = Partial<{
  colorOld: string;
  colorNew: string;
  colorNotLoaded: string;
  maxLineLength: number;
  lineSpacing: number;
  maxLineCount: number;
}>;

export class FileViewModel {
  @observable private _mainController: MainController;
  @observable private _isEditorOpen = false;
  @observable private _file: FileModel;

  @observable private _canvasRef: React.RefObject<HTMLCanvasElement> | undefined;
  @observable private _fileRef: React.RefObject<HTMLDivElement> | undefined;
  @observable private _canvasWorker?: Remote<CanvasWorker>;
  @observable private _worker?: Worker;
  @observable private _redrawCount = 0;
  @observable private _lastDrawnScale = 1;
  @observable private _lastDrawnColorMode?: MainController["coloringMode"] = "age";

  constructor(mainController: MainController, file: FileModel) {
    this._mainController = mainController;
    this._file = file;
    makeObservable(this, undefined, { autoBind: true });
  }

  @action.bound
  dispose() {
    this._mainController.unregisterWorker(this.fileName);
    this._worker?.terminate();
    //this._file.dispose();
  }

  @action.bound
  close() {
    this._mainController.repoController.unloadFiles([this.fileName]);
  }

  get fileName() {
    return this._file.name;
  }

  get fileContent() {
    return this._file.data.lines;
  }

  get fileData() {
    return this._file.data;
  }

  get fileInfo() {
    return this._file.infos;
  }

  get isValid() {
    return this._file.isValid;
  }

  get loading() {
    return this._file.isLoading;
  }

  get isPreview() {
    return this._file.isPreview;
  }

  get colors() {
    return this._file.colors;
  }

  @computed
  get isFavorite() {
    return this._mainController.favoriteFiles.has(this.fileName);
  }

  @action.bound
  setColors(colors: string[]) {
    this._file.setColors(colors);
  }

  @action.bound
  unsetFavorite() {
    this._mainController.toggleFavorite(this.fileName);
  }

  @action.bound
  toggleEditor() {
    this._isEditorOpen = !this._isEditorOpen;
  }

  get isEditorOpen() {
    return this._isEditorOpen;
  }

  @action.bound
  assignCanvasRef(ref: React.RefObject<HTMLCanvasElement>) {
    this._canvasRef = ref;
  }

  @action.bound
  assignFileRef(ref: React.RefObject<HTMLDivElement>) {
    this._fileRef = ref;
    this.draw();
  }

  get fileRef() {
    return this._fileRef;
  }

  get canvasWorker() {
    return this._canvasWorker;
  }

  @action.bound
  setCanvasWorker(worker: Remote<CanvasWorker>) {
    this._canvasWorker = worker;
  }

  @action.bound
  setWorker(worker: Worker) {
    this._worker = worker;
  }

  @computed
  get shouldRedraw() {
    return (
      this.lastDrawScale - this._mainController.scale < -0.25 ||
      this.lastDrawnColorMode !== this._mainController.coloringMode
    );
  }

  @action.bound
  setLastDrawScale(scale: number) {
    this._lastDrawnScale = scale;
  }

  @action.bound
  setLastDrawnColorMode(coloringMode: MainController["coloringMode"]) {
    this._lastDrawnColorMode = coloringMode;
  }

  get lastDrawnColorMode() {
    return this._lastDrawnColorMode;
  }

  get lastDrawScale() {
    return this._lastDrawnScale;
  }

  get redrawCount() {
    return this._redrawCount;
  }

  @action.bound
  setRenderPriority(priority: number) {
    this._file.setRenderPriority(priority);
  }

  get renderPriority() {
    return this._file.renderPriority;
  }

  get shouldRender() {
    return this.renderPriority > 0;
  }

  get fileHeight() {
    return this._file.calculatedHeight + 26;
  }

  @action.bound
  incrementRedrawCount() {
    this._redrawCount++;
  }

  @computed
  get rectHeight() {
    return Math.min(this.fileContent.length * 10, VisualizationDefaults.maxLineCount * 10);
  }

  @action.bound
  createOrRetrieveCanvasWorker(ref: React.RefObject<HTMLCanvasElement>) {
    if (!this._canvasWorker) {
      const worker = new Worker(new URL("worker/worker.ts", import.meta.url), { type: "module" });
      this.setWorker(worker);

      const CanvasWorkerProxy = wrap<CanvasWorker>(worker);

      this._canvasWorker = CanvasWorkerProxy;
    }

    return this._canvasWorker;
  }

  @computed
  get drawingContext() {
    return {
      authors: this._mainController.authors.map((a) => toJS(a)),
      fileContent: toJS(this.fileContent),
      earliestTimestamp: toJS(this.fileData.earliestTimestamp),
      latestTimestamp: toJS(this.fileData.latestTimestamp),
      visualizationConfig: toJS(this._mainController.visualizationConfig),
      lineLengthMax: toJS(this.fileData.maxLineLength),
      isPreview: toJS(this.fileData.isPreview) ?? true,
      selectedStartDate: toJS(this._mainController.selectedStartDate),
      selectedEndDate: toJS(this._mainController.selectedEndDate),
      redrawCount: toJS(this.redrawCount),
      coloringMode: toJS(this._mainController.coloringMode),
    };
  }

  @action.bound
  draw() {
    if (!this._canvasRef || !this._canvasRef.current || !this._fileRef) {
      return;
    }

    if (this.renderPriority <= 0) {
      return;
    }

    const fileContainer = (this._fileRef as any).current;
    if (!fileContainer) {
      return;
    }

    const scale = this._mainController.scale;

    // High resolution displays need different scaling to get the canvas to not appear "blurry"
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays
    const dpr = window.devicePixelRatio * scale * 2;

    const rect = this._canvasRef.current.getBoundingClientRect();
    rect.width = rect.width * (1 / scale);

    const nColumns = 1;
    //if (this.fileContent.length > VisualizationDefaults.maxLineCount) {
    //  nColumns = Math.floor(this.fileContent.length / VisualizationDefaults.maxLineCount) + 1;
    //}

    rect.height = Math.min(
      nColumns > 1 ? VisualizationDefaults.maxLineCount * 10 : this.fileContent.length * 10,
      VisualizationDefaults.maxLineCount * 10,
    );

    if (this._canvasRef?.current) {
      this._canvasRef.current.style.width = `${rect.width}px`;
      //this._canvasRef.current.style.height = `${rect.height}px`;
      //fileContainer.style.height = `${rect.height + 26}px`;
    }

    const CanvasWorkerProxy = this.createOrRetrieveCanvasWorker(this._canvasRef);
    if (!CanvasWorkerProxy) {
      throw new Error("Could not assign canvas worker");
    }

    this._mainController.registerWorker(this.fileName);

    const ctx: FileContext = {
      ...this.drawingContext,
      dpr,
      rect,
      nColumns,
    };

    const drawResult = CanvasWorkerProxy.drawCanvas(ctx);

    drawResult.then((result) => {
      if (!result) return;

      const canvas = this._canvasRef?.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const img = new Image();
      img.addEventListener("load", (event) => {
        if (!event.target) return;

        if ("src" in event.target && typeof event.target.src === "string")
          URL.revokeObjectURL(event.target.src);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(event.target as any, 0, 0);
      });
      img.src = result.result;

      fileContainer.style.width = "300px";
      this.setColors(result.colors);
      //console.log("[gizual-app] UI thread: draw result", result);
      this.setLastDrawScale(scale);
      this.setLastDrawnColorMode(this._mainController.coloringMode);
      this.incrementRedrawCount();
      this._mainController.unregisterWorker(this.fileName);
    });
  }
}
