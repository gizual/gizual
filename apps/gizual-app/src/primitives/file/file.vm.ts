import { action, makeObservable, observable } from "mobx";
import React from "react";

import { MainController } from "../../controllers";
import { getColorScale } from "../../utils";

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
  commit: Commit;
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
  _fileContent!: Line[];
  _lineLengthMax!: number;
  _isFavourite!: boolean;
  _isLoadIndicator!: boolean;
  _earliestTimestamp!: number;
  _latestTimestamp!: number;
  _settings: Required<Settings>;
  _mainController: MainController;
  _isEditorOpen = false;

  _canvasRef: React.RefObject<HTMLCanvasElement> | undefined;
  _fileRef: React.RefObject<HTMLDivElement> | undefined;

  constructor(
    info: FileInfo,
    mainController: MainController,
    settings: Settings,
    isFavourite?: boolean,
    isLoadIndicator?: boolean
  ) {
    this.load(info);
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

    makeObservable(this, {
      _fileName: observable,
      _fileExtension: observable,
      _fileContent: observable,
      _lineLengthMax: observable,
      _isFavourite: observable,
      _isLoadIndicator: observable,
      _canvasRef: observable,
      _isEditorOpen: observable,
      setFavourite: action,
      toggleEditor: action,
      unsetFavourite: action,
      load: action,
    });
  }

  load(info: FileInfo) {
    this._fileName = info.fileName;
    this._fileExtension = info.fileExtension;
    this._fileContent = info.fileContent;
    this._lineLengthMax = info.lineLengthMax;
    this._latestTimestamp = info.latestTimestamp;
    this._earliestTimestamp = info.earliestTimestamp;
    this._isLoadIndicator = false;
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

  get fileContent() {
    return this._fileContent;
  }

  get isFavourite() {
    return this._mainController._favouriteFiles.has(this.fileName);
  }

  get lineLengthMax() {
    return this._lineLengthMax;
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

  interpolateColor(updatedAt: number) {
    const timeRange: [number, number] = [this._earliestTimestamp, this._latestTimestamp];
    const colorRange: [string, string] = [this._settings.colorOld, this._settings.colorNew];

    return getColorScale(timeRange, colorRange)(updatedAt);
  }

  draw() {
    if (!this._canvasRef) {
      return;
    }

    const canvas = this._canvasRef.current;
    if (!canvas) {
      return;
    }

    if (!this._fileRef) {
      return;
    }

    const fileContainer = this._fileRef.current;
    if (!fileContainer) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const lineHeight = 10;
    let currentY = 0;

    let nColumns = 1;
    const columnSpacing = 0;

    if (this._fileContent.length > this._settings.maxLineCount) {
      nColumns = Math.floor(this._fileContent.length / this._settings.maxLineCount) + 1;
    }

    canvas.height = (lineHeight + this._settings.lineSpacing) * this._settings.maxLineCount;

    let currentX = 0;
    let lineIndex = 0;
    for (const line of this._fileContent) {
      const columnWidth = canvas.width / nColumns - (nColumns - 1) * columnSpacing;
      const lineLength = line.content.length;
      const lineOffset =
        ((line.content.length - line.content.trimStart().length) / this._lineLengthMax) *
        columnWidth;

      const rectWidth = ((lineLength - lineOffset) / this._lineLengthMax) * columnWidth;
      const rectHeight = lineHeight;
      ctx.fillStyle = this.interpolateColor(line.commit.timestamp);
      ctx.fillRect(currentX + lineOffset, currentY, rectWidth, rectHeight);
      currentY += lineHeight + this._settings.lineSpacing;
      lineIndex++;
      if (lineIndex > this._settings.maxLineCount) {
        ctx.fillStyle = "#232323";
        currentY = 0;
        currentX += columnWidth;
        ctx.fillRect(currentX - 1, currentY, 1, canvas.height);
        lineIndex = 0;
      }
    }

    const nc = nColumns > 2 ? 2 : nColumns;
    fileContainer.style.width = `${nc * 300}px`;
  }
}
