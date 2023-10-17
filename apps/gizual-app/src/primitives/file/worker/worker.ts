import { MainController, VisualisationDefaults } from "@app/controllers";
import { VisualisationConfig } from "@app/types";
import { BAND_COLOUR_RANGE, getBandColourScale, getColourScale, SvgBaseElement } from "@app/utils";
import { expose } from "comlink";

import { FileViewModel, Line } from "../file.vm";

import { CanvasRenderer, SvgRenderer } from "./renderer";

export type RenderingMode = "canvas" | "svg";
export type FileContext = {
  colouringMode: MainController["_colouringMode"];
  fileContent: FileViewModel["fileContent"];
  visualisationConfig: VisualisationConfig;
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

  async drawCanvas(fileCtx: FileContext): Promise<{ result: string; colours: string[] }> {
    return this.draw(fileCtx, "canvas");
  }

  async drawSingleSvg(
    fileCtx: FileContext,
  ): Promise<{ result: SvgBaseElement[]; colours: string[] }> {
    return this.draw(fileCtx, "svg");
  }

  async draw(fileCtx: FileContext, mode: "canvas"): Promise<{ result: string; colours: string[] }>;
  async draw(
    fileCtx: FileContext,
    mode: "svg",
  ): Promise<{ result: SvgBaseElement[]; colours: string[] }>;
  async draw(fileCtx: FileContext, mode: RenderingMode = "canvas") {
    await this.prepareFont();

    let renderer: CanvasRenderer | SvgRenderer | undefined;
    if (mode === "canvas") renderer = new CanvasRenderer();
    if (mode === "svg") renderer = new SvgRenderer();
    if (!renderer) throw new Error("Renderer not initialized. Provided mode: " + mode);

    renderer.prepareContext(fileCtx.rect.width, fileCtx.rect.height, fileCtx.dpr);

    const colours: string[] = [];

    const columnSpacing = 0;
    const lineHeight = 10 * fileCtx.dpr;

    const currentX = 0;
    let currentY = 0;

    const scaledCanvasWidth = fileCtx.rect.width * fileCtx.dpr;

    let columnWidth = scaledCanvasWidth;

    if (fileCtx.nColumns > 1)
      columnWidth = scaledCanvasWidth / fileCtx.nColumns - (fileCtx.nColumns - 1) * columnSpacing;

    const widthPerCharacter = columnWidth / VisualisationDefaults.maxLineLength;

    for (const [index, line] of fileCtx.fileContent.entries()) {
      if (index + 1 > VisualisationDefaults.maxLineCount) break;
      const lineLength = line.content.length;

      const lineOffsetScaled =
        (line.content.length - line.content.trimStart().length) * widthPerCharacter;

      const rectWidth = Math.min(
        lineLength * widthPerCharacter - lineOffsetScaled,
        scaledCanvasWidth - lineOffsetScaled,
      );

      const colour =
        line.commit && !fileCtx.isPreview
          ? this.interpolateColour(line, fileCtx)
          : fileCtx.visualisationConfig.colours.notLoaded;

      line.color = colour;
      colours.push(line.color);

      renderer.drawRect({
        x: currentX + lineOffsetScaled,
        y: currentY,
        width: rectWidth,
        height: lineHeight,
        fill: colour,
      });
      renderer.drawText(line.content, {
        x: currentX,
        y: currentY + lineHeight / 1.5,
        fontSize: "4",
        fill: "white",
      });

      currentY += lineHeight + VisualisationDefaults.lineSpacing;
    }

    const result = await renderer.getReturnValue();

    return {
      result,
      colours,
    };
  }

  interpolateColour(line: Line, fileContext: FileContext) {
    const updatedAtSeconds = +(line.commit?.timestamp ?? 0);

    // If the line was updated before the start or after the end date, grey it out.
    if (
      updatedAtSeconds * 1000 < fileContext.selectedStartDate.getTime() ||
      updatedAtSeconds * 1000 > fileContext.selectedEndDate.getTime()
    )
      return fileContext.visualisationConfig.colours.notLoaded;

    if (fileContext.colouringMode === "age") {
      const timeRange: [number, number] = [
        fileContext.earliestTimestamp,
        fileContext.latestTimestamp,
      ];
      const colorRange: [string, string] = [
        fileContext.visualisationConfig.colours.oldest,
        fileContext.visualisationConfig.colours.newest,
      ];

      return updatedAtSeconds
        ? getColourScale(timeRange, colorRange)(updatedAtSeconds)
        : fileContext.visualisationConfig.colours.notLoaded;
    } else {
      const author = fileContext.authors.find((a) => a.id === line.commit?.authorId);
      return getBandColourScale(
        fileContext.authors.map((a) => a.id),
        BAND_COLOUR_RANGE,
      )(author?.id ?? "");
    }
  }
}

expose(new CanvasWorker());
