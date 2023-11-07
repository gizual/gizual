import { FileModel, MainController } from "@app/controllers";
import { action, computed, makeObservable, observable, toJS } from "mobx";
import React from "react";

import { GitGraphCommitInfo } from "@giz/explorer";
import { type FileContext, VisualizationDefaults } from "@giz/file-renderer";

export type Line = {
  content: string;
  commit?: GitGraphCommitInfo;
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

  @observable private _canvasRef: React.RefObject<HTMLImageElement> | undefined;
  @observable private _fileRef: React.RefObject<HTMLDivElement> | undefined;
  @observable private _redrawCount = 0;
  @observable private _lastDrawnScale = 1;
  @observable private _lastDrawnColorMode?: MainController["coloringMode"] = "age";
  @observable private _isWorkerBusy? = false;

  constructor(mainController: MainController, file: FileModel) {
    this._mainController = mainController;
    this._file = file;
    makeObservable(this, undefined, { autoBind: true });
  }

  @action.bound
  dispose() {
    this._mainController.unregisterWorker(this.fileName);
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

  get isWorkerBusy() {
    return this._isWorkerBusy;
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
  assignCanvasRef(ref: React.RefObject<HTMLImageElement>) {
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

    const fileContainer = this._fileRef.current;
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

    rect.height = Math.min(
      nColumns > 1 ? VisualizationDefaults.maxLineCount * 10 : this.fileContent.length * 10,
      VisualizationDefaults.maxLineCount * 10,
    );

    if (this._canvasRef?.current) {
      this._canvasRef.current.style.width = `${rect.width}px`;
    }

    this._mainController.registerWorker(this.fileName);

    const ctx: FileContext = {
      ...this.drawingContext,
      dpr,
      rect,
      nColumns,
    };

    this._isWorkerBusy = true;
    const drawResult = this._mainController._fileRendererPool.renderCanvas(ctx);

    drawResult.then((result) => {
      if (!result) return;

      const canvas = this._canvasRef?.current;
      if (!canvas) return;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      canvas.setAttribute("src", result.result);
      canvas.setAttribute("alt", this.fileName);

      setTimeout(() => {
        URL.revokeObjectURL(result.result);
      }, 1000);

      fileContainer.style.width = "300px";
      this._isWorkerBusy = false;
      this.setColors(result.colors);
      //console.log("[gizual-app] UI thread: draw result", result);
      this.setLastDrawScale(scale);
      this.setLastDrawnColorMode(this._mainController.coloringMode);
      this.incrementRedrawCount();
      this._mainController.unregisterWorker(this.fileName);
    });
  }
}
