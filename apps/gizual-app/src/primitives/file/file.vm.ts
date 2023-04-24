import { action, makeObservable, observable } from "mobx";

export type FileInfo = {
  fileName: string;
  fileExtension: string;
  fileContent: string[];
  lineLengthMax: number;
};

export class FileViewModel {
  _fileName: string;
  _fileExtension: string;
  _fileContent: string[];
  _lineLengthMax: number;
  _isFavourite: boolean;
  _isLoadIndicator: boolean;

  _canvasRef: React.RefObject<HTMLCanvasElement> | undefined;

  constructor(info: FileInfo, isFavourite?: boolean, isLoadIndicator?: boolean) {
    this._fileName = info.fileName;
    this._fileExtension = info.fileExtension;
    this._fileContent = info.fileContent;
    this._lineLengthMax = info.lineLengthMax;
    this._isFavourite = isFavourite ?? false;
    this._isLoadIndicator = isLoadIndicator ?? false;

    makeObservable(this, {
      _fileName: observable,
      _fileExtension: observable,
      _fileContent: observable,
      _lineLengthMax: observable,
      _isFavourite: observable,
      _isLoadIndicator: observable,
      _canvasRef: observable,
      setFavourite: action,
      unsetFavourite: action,
      load: action,
    });
  }

  load(info: FileInfo) {
    this._fileName = info.fileName;
    this._fileExtension = info.fileExtension;
    this._fileContent = info.fileContent;
    this._lineLengthMax = info.lineLengthMax;
    this._isLoadIndicator = false;
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
    return this._isFavourite;
  }

  get lineLengthMax() {
    return this._lineLengthMax;
  }

  setFavourite() {
    this._isFavourite = true;
  }

  unsetFavourite() {
    this._isFavourite = false;
  }

  assignCanvasRef(ref: React.RefObject<HTMLCanvasElement>) {
    this._canvasRef = ref;
  }

  get isLoadIndicator() {
    return this._isLoadIndicator;
  }

  draw() {
    if (!this._canvasRef) {
      return;
    }

    const canvas = this._canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const lineSpacing = 10;
    let currentY = 0;

    ctx.fillStyle = "#d1a0c6";

    for (const line of this._fileContent) {
      const lineLength = line.length;
      const rectWidth = (lineLength / this._lineLengthMax) * canvas.width;
      const rectHeight = lineSpacing;
      ctx.fillRect(0, currentY, rectWidth, rectHeight);
      currentY += lineSpacing;
    }
  }
}
