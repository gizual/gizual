import { FileModel, VisualisationDefaults } from "@app/controllers";
import { Remote, transfer, wrap } from "comlink";
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
  colourOld: string;
  colourNew: string;
  colourNotLoaded: string;
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
  @observable private _lastDrawnColourMode?: MainController["colouringMode"] = "age";
  @observable private _lastDrawnContext?: FileContext;

  constructor(mainController: MainController, file: FileModel) {
    this._mainController = mainController;
    this._file = file;
    makeObservable(this, undefined, { autoBind: true });
  }

  @action.bound
  dispose() {
    this._mainController.unregisterWorker(this.fileName);
    this._worker?.terminate();
    this._file.dispose();
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

  @computed
  get isFavourite() {
    return this._mainController.favouriteFiles.has(this.fileName);
  }

  @action.bound
  setColours(colours: string[]) {
    this._file.setColours(colours);
  }

  @action.bound
  unsetFavourite() {
    this._mainController.toggleFavourite(this.fileName);
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
      this.lastDrawnColourMode !== this._mainController.colouringMode
    );
  }

  @action.bound
  setLastDrawScale(scale: number) {
    this._lastDrawnScale = scale;
  }

  @action.bound
  setLastDrawnColourMode(colouringMode: MainController["colouringMode"]) {
    this._lastDrawnColourMode = colouringMode;
  }

  get lastDrawnColourMode() {
    return this._lastDrawnColourMode;
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

  @action.bound
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

  @action.bound
  draw() {
    console.log("Calling draw for file", this.fileName, this.renderPriority);
    if (!this._canvasRef || !this._canvasRef.current || !this._fileRef) {
      return;
    }

    if (this.renderPriority <= 0) return;

    const fileContainer = (this._fileRef as any).current;
    if (!fileContainer) {
      return;
    }

    const scale = this._mainController.scale;
    const colouringMode = this._mainController.colouringMode;

    // High resolution displays need different scaling to get the canvas to not appear "blurry"
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays
    const dpr = window.devicePixelRatio * scale * 2;

    const rect = this._canvasRef.current.getBoundingClientRect();
    rect.width = rect.width * (1 / scale);

    const nColumns = 1;
    //if (this.fileContent.length > VisualisationDefaults.maxLineCount) {
    //  nColumns = Math.floor(this.fileContent.length / VisualisationDefaults.maxLineCount) + 1;
    //}

    rect.height = Math.min(
      nColumns > 1 ? VisualisationDefaults.maxLineCount * 10 : this.fileContent.length * 10,
      VisualisationDefaults.maxLineCount * 10,
    );

    if (this._canvasRef?.current) {
      this._canvasRef.current.style.width = `${rect.width}px`;
      this._canvasRef.current.style.height = `${rect.height}px`;
      fileContainer.style.height = `${rect.height + 26}px`;
    }

    const CanvasWorkerProxy = this.createOrRetrieveCanvasWorker(this._canvasRef);
    if (!CanvasWorkerProxy) {
      throw new Error("Could not assign canvas worker");
    }

    this._mainController.registerWorker(this.fileName);

    const ctx = {
      authors: this._mainController.authors.map((a) => toJS(a)),
      fileContent: toJS(this.fileContent),
      earliestTimestamp: toJS(this.fileData.earliestTimestamp),
      latestTimestamp: toJS(this.fileData.latestTimestamp),
      visualisationConfig: toJS(this._mainController.visualisationConfig),
      lineLengthMax: toJS(this.fileData.maxLineLength),
      isPreview: toJS(this.fileData.isPreview) ?? true,
      selectedStartDate: toJS(this._mainController.selectedStartDate),
      selectedEndDate: toJS(this._mainController.selectedEndDate),
      dpr,
      rect,
      colouringMode,
      nColumns,
      redrawCount: toJS(this.redrawCount),
    };

    if (!needsToRender(ctx, this._lastDrawnContext)) return;

    console.log("Actually drawing file:", this.fileName);
    const drawResult = CanvasWorkerProxy.draw(ctx);

    drawResult.then((result) => {
      if (!result) return;
      fileContainer.style.width = result.width;
      this.setColours(result.colours);
      //console.log("[gizual-app] UI thread: draw result", result);
      this.setLastDrawScale(scale);
      this.setLastDrawnColourMode(colouringMode);
      this.incrementRedrawCount();
      this._mainController.unregisterWorker(this.fileName);
    });
  }
}

function needsToRender(newCtx: FileContext, oldCtx?: FileContext) {
  return true;
  return JSON.stringify(oldCtx) !== JSON.stringify(newCtx);
}
