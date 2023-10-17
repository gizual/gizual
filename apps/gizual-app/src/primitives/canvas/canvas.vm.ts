import { ColouringMode, ColouringModeLabels } from "@app/types";
import { Masonry, truncateSmart } from "@app/utils";
import { action, computed, makeObservable, observable, toJS } from "mobx";
import { RefObject } from "react";
import { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

import { FileModel, MainController, VisualisationDefaults } from "../../controllers";
import {
  SvgBaseElement,
  SvgGroupElement,
  SvgRectElement,
  SvgTextElement,
} from "../file/worker/svg";
import { CanvasWorker, FileContext } from "../file/worker/worker";

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;

export class CanvasViewModel {
  @observable private _mainController: MainController;
  @observable private _canvasContainerRef?: RefObject<ReactZoomPanPinchRef>;
  @observable private _canvasWidth = 0;

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
      this._canvasContainerRef.current.instance.contentComponent.style.width = `calc(100% / ${this._mainController.scale})`;
      this._canvasContainerRef.current.instance.contentComponent.style.height = `calc(100% / ${this._mainController.scale})`;
      this._canvasWidth = this._canvasContainerRef.current.instance.contentComponent.clientWidth;
    }
    this.center();
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

  getDrawingContext(file: FileModel) {
    return {
      authors: this._mainController.authors.map((a) => toJS(a)),
      fileContent: toJS(file.data.lines),
      earliestTimestamp: toJS(file.data.earliestTimestamp),
      latestTimestamp: toJS(file.data.latestTimestamp),
      visualisationConfig: toJS(this._mainController.visualisationConfig),
      lineLengthMax: toJS(file.data.maxLineLength),
      isPreview: toJS(file.isPreview),
      selectedStartDate: toJS(this._mainController.selectedStartDate),
      selectedEndDate: toJS(this._mainController.selectedEndDate),
      colouringMode: toJS(this._mainController.colouringMode),
    };
  }

  @action.bound
  async drawSvg() {
    const svgChildren: SvgBaseElement[] = [];
    const width = this.canvasWidth;

    // We want to use the masonry layout just for evaluating the required transform,
    // no need to store the elements within the Masonry grid.
    const masonry = new Masonry<undefined>({ canvasWidth: width, gap: 16 });

    for (const file of this.loadedFiles) {
      if (file.data.lines.length === 0) continue;

      const rectHeight = Math.min(
        file.data.lines.length * 10,
        VisualisationDefaults.maxLineCount * 10,
      );

      const ctx: FileContext = {
        ...this.getDrawingContext(file),
        dpr: 1,
        nColumns: 1,
        redrawCount: 0,
        rect: new DOMRect(0, 0, 300, rectHeight),
      };

      const titleHeight = 30;
      const worker = new CanvasWorker();
      const result = await worker.drawSingleSvg(ctx);

      const fileContainer = new SvgGroupElement(0, 0, 300, rectHeight + titleHeight);
      const border = new SvgRectElement({
        x: 0,
        y: 0,
        width: 300,
        height: rectHeight + titleHeight,
        fill: "transparent",
        stroke: this._mainController.getStyle("--color-gray"),
      });
      const title = new SvgTextElement(truncateSmart(file.name, 35), {
        x: 8,
        y: 20,
        fontSize: "14",
      });
      const titleBackground = new SvgRectElement({
        x: 0,
        y: 0,
        width: 300,
        height: titleHeight,
        fill: this._mainController.getStyle("--color-zinc"),
        stroke: "transparent",
      });
      fileContainer.assignChildren(border, titleBackground, title);

      const fileContent = new SvgGroupElement(0, 0, 300, rectHeight);
      fileContent.transform = { x: 0, y: titleHeight };
      fileContainer.addChild(fileContent);

      const position = masonry.insertElement({
        id: file.name,
        content: undefined,
        height: rectHeight + titleHeight,
      });

      fileContainer.transform = {
        x: position.x,
        y: position.startHeight + position.itemId * 16,
      };
      fileContent.assignChildren(...result.result);
      svgChildren.push(fileContainer);
    }

    const styleTag = `xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink"`;
    const svg = `<svg ${styleTag} viewBox="0 0 ${width} ${masonry.maxHeight}">${svgChildren
      .map((c) => c.render())
      .join("")}</svg>`;

    const blob = new Blob([svg.toString()]);
    const element = document.createElement("a");
    element.download = `${this._mainController.repoName}.gizual.svg`;
    element.href = window.URL.createObjectURL(blob);
    element.click();
    element.remove();
  }
}
