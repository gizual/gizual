import { MainController, VisualisationDefaults } from "@app/controllers";
import { VisualisationConfig } from "@app/types";
import { BAND_COLOUR_RANGE, getBandColourScale, getColourScale, SPECIAL_COLOURS } from "@app/utils";
import { expose } from "comlink";

import { FileViewModel, Line } from "../file.vm";

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
  _offscreen?: OffscreenCanvas;

  constructor() {}

  async registerCanvas(canvas: OffscreenCanvas) {
    this._offscreen = canvas;
  }

  async draw(fileCtx: FileContext) {
    if (!this._offscreen) return;

    const canvas = this._offscreen;
    const colours: string[] = [];

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.scale(fileCtx.dpr, fileCtx.dpr);

    let currentY = 0;

    const columnSpacing = 0;

    canvas.height = fileCtx.rect.height * fileCtx.dpr;
    //(lineHeight + fileContext.settings.lineSpacing) * fileContext.settings.maxLineCount;
    const lineHeight = 10 * fileCtx.dpr; //canvas.height / fileCtx.settings.maxLineCount - fileCtx.settings.lineSpacing;

    canvas.width = fileCtx.rect.width * fileCtx.dpr; //canvas.width * resolutionScale;

    let currentX = 0;
    let lineIndex = 0;
    let currentColumn = 0;

    const columnWidth = canvas.width / fileCtx.nColumns - (fileCtx.nColumns - 1) * columnSpacing;
    const widthPerCharacter = columnWidth / VisualisationDefaults.maxLineLength;

    for (const line of fileCtx.fileContent) {
      const lineLength = line.content.length;

      const lineOffsetScaled =
        (line.content.trimStart().length - line.content.length) * widthPerCharacter;

      const rectWidth = lineLength * widthPerCharacter - lineOffsetScaled;

      const rectHeight = lineHeight;
      const colour =
        line.commit && !fileCtx.isPreview
          ? this.interpolateColour(line, fileCtx)
          : fileCtx.visualisationConfig.colours.notLoaded;

      ctx.fillStyle = colour;
      line.color = colour;
      colours.push(line.color);

      ctx.fillRect(currentX + lineOffsetScaled, currentY, rectWidth, rectHeight);
      ctx.font = `${4 * fileCtx.dpr}px Iosevka Extended`;
      ctx.fillStyle = "white";
      ctx.fillText(line.content, currentX, currentY + rectHeight / 1.5);

      currentY += lineHeight + VisualisationDefaults.lineSpacing;
      lineIndex++;

      if (lineIndex > VisualisationDefaults.maxLineCount && currentColumn < fileCtx.nColumns - 1) {
        ctx.fillStyle = SPECIAL_COLOURS.NOT_LOADED;
        currentY = 0;
        currentX += columnWidth;
        ctx.fillRect(currentX - 1, currentY, 1, canvas.height);
        lineIndex = 0;
        currentColumn++;
      }
    }

    const nc = 1; //nColumns > 2 ? 2 : nColumns;

    ctx.font = `${5 * fileCtx.dpr}px Arial`;
    ctx.fillStyle = "white";
    ctx.fillText(
      `redraws: ${fileCtx.redrawCount}`,
      canvas.width - canvas.width / 8,
      10 * fileCtx.dpr,
    );

    const blob = await canvas.convertToBlob();
    return { img: blob, width: `${nc * 300}px`, colours };
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
