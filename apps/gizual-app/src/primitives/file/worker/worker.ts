import { expose } from "comlink";

import { MainController } from "../../../controllers";
import { BAND_COLOR_RANGE, getBandColorScale, getColorScale, SPECIAL_COLORS } from "../../../utils";
import { FileViewModel, Line } from "../file.vm";

export type FileContext = {
  coloringMode: MainController["_coloringMode"];
  fileContent: FileViewModel["fileContent"];
  settings: FileViewModel["_settings"];
  lineLengthMax: FileViewModel["lineLengthMax"];
  earliestTimestamp: FileViewModel["earliestTimestamp"];
  latestTimestamp: FileViewModel["latestTimestamp"];
  authors: MainController["authors"];
  dpr: number;
  rect: DOMRect;
  redrawCount: number;
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
    const colors: string[] = [];

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.scale(fileCtx.dpr, fileCtx.dpr);

    let currentY = 0;

    let nColumns = 1;
    const columnSpacing = 0;

    if (fileCtx.fileContent.length > fileCtx.settings.maxLineCount) {
      nColumns = Math.floor(fileCtx.fileContent.length / fileCtx.settings.maxLineCount) + 1;
    }

    canvas.height = fileCtx.rect.height * fileCtx.dpr;
    //(lineHeight + fileContext.settings.lineSpacing) * fileContext.settings.maxLineCount;
    const lineHeight = canvas.height / fileCtx.settings.maxLineCount - fileCtx.settings.lineSpacing;

    canvas.width = fileCtx.rect.width * fileCtx.dpr; //canvas.width * resolutionScale;

    let currentX = 0;
    let lineIndex = 0;
    for (const line of fileCtx.fileContent) {
      const columnWidth = canvas.width / nColumns - (nColumns - 1) * columnSpacing;
      const lineLength = line.content.length;

      const lineOffsetUnscaled =
        (line.content.length - line.content.trimStart().length) / fileCtx.lineLengthMax;

      const lineOffsetScaled = lineOffsetUnscaled * columnWidth;

      const rectWidth = ((lineLength - lineOffsetUnscaled) / fileCtx.lineLengthMax) * columnWidth;

      const rectHeight = lineHeight;
      const color = line.commit ? this.interpolateColor(line, fileCtx) : SPECIAL_COLORS.NOT_LOADED;

      ctx.fillStyle = color;
      line.color = color;
      colors.push(line.color);
      ctx.fillRect(currentX + lineOffsetScaled, currentY, rectWidth, rectHeight);
      currentY += lineHeight + fileCtx.settings.lineSpacing;
      lineIndex++;

      if (lineIndex > fileCtx.settings.maxLineCount) {
        ctx.fillStyle = SPECIAL_COLORS.NOT_LOADED;
        currentY = 0;
        currentX += columnWidth;
        ctx.fillRect(currentX - 1, currentY, 1, canvas.height);
        lineIndex = 0;
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

    console.log("[gizual-app] [canvas-worker] draw finished");
    const blob = await canvas.convertToBlob();
    return { img: blob, width: `${nc * 300}px`, colors };
  }

  interpolateColor(line: Line, fileContext: FileContext) {
    if (fileContext.coloringMode === "By Age") {
      const updatedAt = +(line.commit?.timestamp ?? 0);
      const timeRange: [number, number] = [
        fileContext.earliestTimestamp,
        fileContext.latestTimestamp,
      ];
      const colorRange: [string, string] = [
        fileContext.settings.colorOld,
        fileContext.settings.colorNew,
      ];

      return updatedAt
        ? getColorScale(timeRange, colorRange)(updatedAt)
        : SPECIAL_COLORS.NOT_LOADED;
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
