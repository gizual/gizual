import { MainController, VisualizationDefaults } from "@app/controllers";
import { VisualizationConfig } from "@app/types";
import { BAND_COLOR_RANGE, getBandColorScale, getColorScale, SvgBaseElement } from "@app/utils";
import { expose } from "comlink";

import { FileViewModel, Line } from "../file.vm";

import { CanvasRenderer, SvgRenderer } from "./renderer";

export type RenderingMode = "canvas" | "svg";
export type FileContext = {
  coloringMode: MainController["_coloringMode"];
  fileContent: FileViewModel["fileContent"];
  visualizationConfig: VisualizationConfig;
  lineLengthMax: number;
  earliestTimestamp: number;
  latestTimestamp: number;
  isPreview: boolean;
  selectedStartDate: Date;
  selectedEndDate: Date;
  authors: MainController["authors"];
  dpr: number;
  rect: DOMRect;
  redrawCount: number;
  nColumns: number;
};

export class CanvasWorker {
  constructor() {}

  //async registerCanvas(canvas: OffscreenCanvas) {
  //  this._offscreen = canvas;
  //}

  async prepareFont() {
    if (self.FontFace && (self as any).fonts) {
      const fontFace = new FontFace("Iosevka Extended", "local('Iosevka Extended')");
      // add it to the list of fonts our worker supports
      (self as any).fonts.add(fontFace);
      // load the font
      return fontFace.load();
    }
  }

  async drawCanvas(fileCtx: FileContext): Promise<{ result: string; colors: string[] }> {
    return this.draw(fileCtx, "canvas");
  }

  async drawSingleSvg(
    fileCtx: FileContext,
  ): Promise<{ result: SvgBaseElement[]; colors: string[] }> {
    return this.draw(fileCtx, "svg");
  }

  async draw(fileCtx: FileContext, mode: "canvas"): Promise<{ result: string; colors: string[] }>;
  async draw(
    fileCtx: FileContext,
    mode: "svg",
  ): Promise<{ result: SvgBaseElement[]; colors: string[] }>;
  async draw(fileCtx: FileContext, mode: RenderingMode = "canvas") {
    await this.prepareFont();

    let renderer: CanvasRenderer | SvgRenderer | undefined;
    if (mode === "canvas") renderer = new CanvasRenderer();
    if (mode === "svg") renderer = new SvgRenderer();
    if (!renderer) throw new Error("Renderer not initialized. Provided mode: " + mode);

    renderer.prepareContext(fileCtx.rect.width, fileCtx.rect.height, fileCtx.dpr);

    const colors: string[] = [];

    const columnSpacing = 0;
    const lineHeight = 10 * fileCtx.dpr;

    const currentX = 0;
    let currentY = 0;

    const scaledCanvasWidth = fileCtx.rect.width * fileCtx.dpr;

    let columnWidth = scaledCanvasWidth;

    if (fileCtx.nColumns > 1)
      columnWidth = scaledCanvasWidth / fileCtx.nColumns - (fileCtx.nColumns - 1) * columnSpacing;

    const widthPerCharacter = columnWidth / VisualizationDefaults.maxLineLength;

    for (const [index, line] of fileCtx.fileContent.entries()) {
      if (index + 1 > VisualizationDefaults.maxLineCount) break;
      const lineLength = line.content.length;

      let rectWidth = columnWidth;
      let lineOffsetScaled = 0;

      if (fileCtx.visualizationConfig.style.lineLength === "lineLength") {
        lineOffsetScaled =
          (line.content.length - line.content.trimStart().length) * widthPerCharacter;
        rectWidth = Math.min(
          lineLength * widthPerCharacter - lineOffsetScaled,
          scaledCanvasWidth - lineOffsetScaled,
        );
      }

      const color =
        line.commit && !fileCtx.isPreview
          ? this.interpolateColor(line, fileCtx)
          : fileCtx.visualizationConfig.colors.notLoaded;

      line.color = color;
      colors.push(line.color);

      renderer.drawRect({
        x: currentX + lineOffsetScaled,
        y: currentY,
        width: rectWidth,
        height: lineHeight,
        fill: color,
      });
      renderer.drawText(line.content, {
        x: currentX,
        y: currentY + lineHeight / 1.5,
        fontSize: "4",
        fill: "white",
      });

      currentY += lineHeight + VisualizationDefaults.lineSpacing;
    }

    const result = await renderer.getReturnValue();

    return {
      result,
      colors,
    };
  }

  interpolateColor(line: Line, fileContext: FileContext) {
    const updatedAtSeconds = +(line.commit?.timestamp ?? 0);

    // If the line was updated before the start or after the end date, grey it out.
    if (
      updatedAtSeconds * 1000 < fileContext.selectedStartDate.getTime() ||
      updatedAtSeconds * 1000 > fileContext.selectedEndDate.getTime()
    )
      return fileContext.visualizationConfig.colors.notLoaded;

    if (fileContext.coloringMode === "age") {
      const timeRange: [number, number] = [
        fileContext.earliestTimestamp,
        fileContext.latestTimestamp,
      ];
      const colorRange: [string, string] = [
        fileContext.visualizationConfig.colors.oldest,
        fileContext.visualizationConfig.colors.newest,
      ];

      return updatedAtSeconds
        ? getColorScale(timeRange, colorRange)(updatedAtSeconds)
        : fileContext.visualizationConfig.colors.notLoaded;
    } else {
      const author = fileContext.authors.find((a) => a.id === line.commit?.authorId);
      return getBandColorScale(
        fileContext.authors.map((a) => a.id),
        BAND_COLOR_RANGE,
      )(author?.id ?? "");
    }
  }
}

expose(new CanvasWorker());
