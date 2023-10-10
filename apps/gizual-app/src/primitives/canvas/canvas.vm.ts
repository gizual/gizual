import { ColouringMode, ColouringModeLabels } from "@app/types";
import { makeAutoObservable, reaction } from "mobx";
import { RefObject } from "react";
import { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

import { FileModel, MainController } from "../../controllers";
import { FileViewModel } from "../file/file.vm";

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;

export class CanvasViewModel {
  private _mainController: MainController;
  private _loadedFileVms: Record<string, FileViewModel> = {};
  private _canvasContainerRef?: RefObject<ReactZoomPanPinchRef>;

  constructor(mainController: MainController) {
    this._mainController = mainController;
    this._mainController.vmController.setCanvasViewModel(this);

    makeAutoObservable(this, {}, { autoBind: true });

    reaction(
      () => this._mainController.repoController.loadedFiles,
      () => {
        this.updateFileViewModels();
      },
      { fireImmediately: true },
    );
  }

  updateFileViewModels() {}

  get loadedFiles(): FileModel[] {
    return this._mainController.repoController.loadedFiles;
    //return Object.values(this._loadedFileVms);
  }

  setCanvasContainerRef(ref: RefObject<ReactZoomPanPinchRef>) {
    this._canvasContainerRef = ref;
  }

  get canvasContainerRef(): RefObject<ReactZoomPanPinchRef> | undefined {
    return this._canvasContainerRef;
  }

  //getFileRef(fileName: string): RefObject<HTMLDivElement> | undefined {
  //  console.log("Getting ref for", fileName, this.fileRefs?.get(fileName));
  //  return this.fileRefs?.get(fileName);
  //}

  //get fileRefs(): Map<string, RefObject<HTMLDivElement>> | undefined {
  //  return new Map(this._mainController.selectedFiles.map((f) => [f, React.createRef()]));
  //}

  zoomIn() {
    if (!this.canvasContainerRef?.current) return;
    this.canvasContainerRef.current.zoomIn(0.25);
  }

  zoomOut() {
    if (!this.canvasContainerRef?.current) return;
    this.canvasContainerRef.current.zoomOut(0.25);
  }

  center(scale?: number) {
    if (!this.canvasContainerRef?.current) return;
    this.canvasContainerRef.current.setTransform(0, 0, scale ?? this._mainController.scale);
  }

  zoomTo(n: number | null) {
    if (!this.canvasContainerRef?.current || !n) return;
    n = n / 100;
    if (n < MIN_ZOOM || n > MAX_ZOOM) return;

    this.canvasContainerRef.current.zoomOut(this._mainController.scale - n, 0);
  }

  zoomToFile(fileName: string) {
    const el = undefined; // TODO: this.getFileRef(fileName)?.current;
    if (!el) return;

    this.canvasContainerRef?.current?.zoomToElement(el, 0);
  }

  unloadAllFiles() {
    this._mainController.repoController.unloadAllFiles();
  }

  onColouringModeChange = (value: ColouringMode) => {
    this._mainController.setColouringMode(value);

    if (value !== "author" && this._mainController.vmController.isAuthorPanelVisible)
      this._mainController.vmController.setAuthorPanelVisibility(false);

    if (value === "author" && !this._mainController.vmController.isAuthorPanelVisible)
      this._mainController.vmController.setAuthorPanelVisibility(true);
  };

  get toggleColouringValues() {
    return Object.entries(ColouringModeLabels).map((c) => ({ value: c[0], label: c[1] }));
  }
}
