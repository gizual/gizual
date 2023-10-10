import { ColouringMode, ColouringModeLabels } from "@app/types";
import { action, computed, makeObservable, observable } from "mobx";
import { RefObject } from "react";
import { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

import { FileModel, MainController } from "../../controllers";

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;

export class CanvasViewModel {
  @observable private _mainController: MainController;
  @observable private _canvasContainerRef?: RefObject<ReactZoomPanPinchRef>;
  @observable private _canvasWidth = 0;
  @observable private _lastReflowScale = 1;

  constructor(mainController: MainController) {
    this._mainController = mainController;
    this._mainController.vmController.setCanvasViewModel(this);

    makeObservable(this, undefined, { autoBind: true });
  }

  get loadedFiles(): FileModel[] {
    return this._mainController.repoController.loadedFiles;
    //return Object.values(this._loadedFileVms);
  }

  get canvasContainerRef(): RefObject<ReactZoomPanPinchRef> | undefined {
    return this._canvasContainerRef;
  }

  get hasLoadedFiles() {
    return this._mainController.repoController.loadedFiles.length > 0;
  }

  @action.bound
  setCanvasContainerRef(ref: RefObject<ReactZoomPanPinchRef>) {
    this._canvasContainerRef = ref;
    if (ref.current) this._canvasWidth = ref.current?.instance.contentComponent?.clientWidth ?? 0;
  }

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

  @action.bound
  reflow() {
    if (
      this._canvasContainerRef?.current &&
      this._canvasContainerRef.current.instance.contentComponent
    ) {
      this._canvasWidth = this._canvasContainerRef.current.instance.contentComponent.clientWidth;
      this._canvasContainerRef.current.instance.contentComponent.style.width = `calc(100% / ${this._mainController.scale})`;
      this._canvasContainerRef.current.instance.contentComponent.style.height = `calc(100% / ${this._mainController.scale})`;
    }
    this.center();
    this._lastReflowScale = this._mainController.scale;
  }

  get lastReflowScale() {
    return this._lastReflowScale;
  }

  get canvasWidth() {
    return this._canvasWidth;
  }

  @action.bound
  unloadAllFiles() {
    this._mainController.repoController.unloadAllFiles();
  }

  @action.bound
  onColouringModeChange = (value: ColouringMode) => {
    this._mainController.setColouringMode(value);

    if (value !== "author" && this._mainController.vmController.isAuthorPanelVisible)
      this._mainController.vmController.setAuthorPanelVisibility(false);

    if (value === "author" && !this._mainController.vmController.isAuthorPanelVisible)
      this._mainController.vmController.setAuthorPanelVisibility(true);
  };

  @computed
  get toggleColouringValues() {
    return Object.entries(ColouringModeLabels).map((c) => ({ value: c[0], label: c[1] }));
  }
}
