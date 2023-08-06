import _ from "lodash";
import { autorun, makeAutoObservable } from "mobx";
import React, { RefObject } from "react";
import { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { FileNodeInfos } from "@app/types";

import { MainController } from "../../controllers";
import { FileViewModel } from "../file/file.vm";

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

export class CanvasViewModel {
  _mainController: MainController;
  _selectedFileVms: Record<string, FileViewModel> = {};
  _canvasContainerRef?: RefObject<ReactZoomPanPinchRef>;

  constructor(mainController: MainController) {
    this._mainController = mainController;
    this._mainController.vmController.setCanvasViewModel(this);

    makeAutoObservable(this);

    autorun(() => {
      this.loadSelectedFiles();
    });
  }

  loadSelectedFiles() {
    const selectedFiles = this._mainController.selectedFiles;
    const existingFiles = Object.keys(this._selectedFileVms);

    const filesToLoad = _.difference(selectedFiles, existingFiles);
    const filesToUnload = _.difference(existingFiles, selectedFiles);

    for (const file of filesToLoad) {
      const fileInfo = this._mainController.getSelectedFileNodeInfo(file);
      if (!fileInfo) console.warn(`Info object for ${file} not found.`);

      this._selectedFileVms[file] = new FileViewModel(
        this._mainController,
        file,
        {},
        fileInfo as FileNodeInfos,
        false,
        false,
      );
    }

    for (const file of filesToUnload) {
      delete this._selectedFileVms[file];
    }
  }

  get selectedFiles(): FileViewModel[] {
    return Object.values(this._selectedFileVms);
  }

  setCanvasContainerRef(ref: RefObject<ReactZoomPanPinchRef>) {
    this._canvasContainerRef = ref;
  }

  get canvasContainerRef(): RefObject<ReactZoomPanPinchRef> | undefined {
    return this._canvasContainerRef;
  }

  getFileRef(fileName: string): RefObject<HTMLDivElement> | undefined {
    return this.fileRefs?.get(fileName);
  }

  get fileRefs(): Map<string, RefObject<HTMLDivElement>> | undefined {
    return new Map(this._mainController.selectedFiles.map((f) => [f, React.createRef()]));
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
    const el = this.getFileRef(fileName)?.current;
    if (!el) return;

    this.canvasContainerRef?.current?.zoomToElement(el, 0);
  }

  unloadAllFiles() {
    for (const file of Object.keys(this._selectedFileVms)) {
      this._mainController.toggleFile(file);
      delete this._selectedFileVms[file];
    }
  }
}
