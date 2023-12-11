import { FileModel, MainController } from "@app/controllers";
import { ColoringMode, ColoringModeLabels } from "@app/types";
import {
  CanvasScale,
  Masonry,
  SvgBaseElement,
  SvgGroupElement,
  SvgRectElement,
  SvgTextElement,
  truncateSmart,
} from "@app/utils";
import { action, computed, makeObservable, observable, toJS } from "mobx";
import { RefObject } from "react";
import { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

import { FileLinesContext, RenderType } from "@giz/file-renderer";
import { FileRendererWorker } from "@giz/file-renderer/worker";

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

  resetScale() {
    this.center(1);
  }

  zoomTo(n: number | null) {
    if (!this.canvasContainerRef?.current || !n) return;
    n = n / 100;
    n = Math.max(CanvasScale.min, Math.min(CanvasScale.max, n));

    const { positionX = 0, positionY = 0 } = this.canvasContainerRef.current.state ?? {};
    this.canvasContainerRef.current.setTransform(positionX, positionY, n);
  }

  zoomToFile(_fileName: string) {
    const el = undefined; // TODO: Attach to file after maestro rework
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
  onColoringModeChange = (value: ColoringMode) => {
    this._mainController.setColoringMode(value);

    if (value !== "author" && this._mainController.vmController.isAuthorPanelVisible)
      this._mainController.vmController.setAuthorPanelVisibility(false);

    if (value === "author" && !this._mainController.vmController.isAuthorPanelVisible)
      this._mainController.vmController.setAuthorPanelVisibility(true);
  };

  @computed
  get toggleColoringValues() {
    return Object.entries(ColoringModeLabels).map((c) => ({ value: c[0], label: c[1] }));
  }

  getDrawingContext(file: FileModel): Partial<FileLinesContext> {
    return {
      type: RenderType.FileLines,
      authors: this._mainController.authors.map((a) => toJS(a)),
      fileContent: toJS(file.data.lines),
      earliestTimestamp: toJS(file.data.earliestTimestamp),
      latestTimestamp: toJS(file.data.latestTimestamp),
      visualizationConfig: toJS(this._mainController.visualizationConfig),
      lineLengthMax: toJS(file.data.maxLineLength),
      isPreview: toJS(file.isPreview),
      selectedStartDate: toJS(this._mainController.selectedStartDate),
      selectedEndDate: toJS(this._mainController.selectedEndDate),
      coloringMode: toJS(this._mainController.coloringMode),
    };
  }

  @action.bound
  async drawSvg(width = this.canvasWidth, appearance: "dark" | "light" = "light") {
    const svgChildren: SvgBaseElement[] = [];

    const masonry = new Masonry<SvgBaseElement>({ canvasWidth: width, gap: 16 });

    const renderer = new FileRendererWorker();

    for (const file of this.loadedFiles) {
      if (file.data.lines.length === 0) continue;

      const ctx: FileLinesContext = {
        ...this.getDrawingContext(file),
        dpr: 1,
        rect: new DOMRect(0, 0, 300, file.calculatedHeight),
      } as FileLinesContext;

      const titleHeight = 26;
      const result = await renderer.drawSingleSvg(ctx);

      const fileContainer = new SvgGroupElement(0, 0, 300, file.calculatedHeight + titleHeight);
      const border = new SvgRectElement({
        x: 0,
        y: 0,
        width: 300,
        height: file.calculatedHeight + titleHeight,
        fill: "transparent",
        stroke:
          appearance === "light"
            ? this._mainController.getStyle("--color-gray")
            : this._mainController.getStyle("--color-darkslate"),
      });
      const title = new SvgTextElement(truncateSmart(file.name, 35), {
        x: 8,
        y: 16,
        fontSize: "14",
        fill:
          appearance === "light"
            ? this._mainController.getStyle("--color-darkgray")
            : this._mainController.getStyle("--color-lightgray"),
      });
      const titleBackground = new SvgRectElement({
        x: 0,
        y: 0,
        width: 300,
        height: titleHeight,
        fill:
          appearance === "light"
            ? this._mainController.getStyle("--color-zinc")
            : this._mainController.getStyle("--color-gunmetal"),
        stroke: "transparent",
      });
      fileContainer.assignChildren(border, titleBackground, title);

      const fileContent = new SvgGroupElement(0, 0, 300, file.calculatedHeight);
      fileContent.transform = { x: 0, y: titleHeight };
      fileContainer.addChild(fileContent);

      masonry.insertElement({
        id: file.name,
        content: fileContainer,
        height: file.calculatedHeight + titleHeight,
      });

      fileContent.assignChildren(...result.result);
      //svgChildren.push(fileContainer);
    }

    masonry.sortAndPack();

    for (const [index, column] of masonry.columns.entries()) {
      for (const [columnIndex, child] of column.content.entries()) {
        child.content.transform = {
          x: index * 316 + 16,
          y: child.y + columnIndex * 16 + 32, // 16px gap between items, 32px padding to top
        };
        svgChildren.push(child.content);
      }
    }

    const styleTag = `xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink"`;
    const style = `style="background-color:${
      appearance === "light"
        ? this._mainController.getStyle("--color-white")
        : this._mainController.getStyle("--color-darkgray")
    };font-family: Courier New;font-size: 0.5rem;"`;
    const svg = `<svg ${styleTag} ${style} viewBox="0 0 ${width} ${masonry.maxHeight}">${svgChildren
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
