import { expose } from "comlink";

import { getColorScale, SPECIAL_COLORS } from "../../../utils";
import { FileViewModel } from "../file.vm";

export type FileContext = {
  fileContent: FileViewModel["fileContent"];
  settings: FileViewModel["_settings"];
  lineLengthMax: FileViewModel["lineLengthMax"];
  earliestTimestamp: FileViewModel["earliestTimestamp"];
  latestTimestamp: FileViewModel["latestTimestamp"];
};

export class CanvasWorker {
  constructor() {}

  async draw(offscreen: OffscreenCanvas, fileContext: FileContext) {
    const canvas = offscreen;
    const colors: string[] = [];

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const lineHeight = 10;
    let currentY = 0;

    let nColumns = 1;
    const columnSpacing = 0;

    if (fileContext.fileContent.length > fileContext.settings.maxLineCount) {
      nColumns = Math.floor(fileContext.fileContent.length / fileContext.settings.maxLineCount) + 1;
    }

    canvas.height =
      (lineHeight + fileContext.settings.lineSpacing) * fileContext.settings.maxLineCount;

    let currentX = 0;
    let lineIndex = 0;
    for (const line of fileContext.fileContent) {
      const columnWidth = canvas.width / nColumns - (nColumns - 1) * columnSpacing;
      const lineLength = line.content.length;
      const lineOffset =
        ((line.content.length - line.content.trimStart().length) / fileContext.lineLengthMax) *
        columnWidth;

      const rectWidth = ((lineLength - lineOffset) / fileContext.lineLengthMax) * columnWidth;
      const rectHeight = lineHeight;
      const color = line.commit
        ? this.interpolateColor(line.commit.timestamp, fileContext)
        : SPECIAL_COLORS.NOT_LOADED;

      ctx.fillStyle = color;
      line.color = color;
      colors.push(line.color);
      ctx.fillRect(currentX + lineOffset, currentY, rectWidth, rectHeight);
      currentY += lineHeight + fileContext.settings.lineSpacing;
      lineIndex++;

      if (lineIndex > fileContext.settings.maxLineCount) {
        ctx.fillStyle = SPECIAL_COLORS.NOT_LOADED;
        currentY = 0;
        currentX += columnWidth;
        ctx.fillRect(currentX - 1, currentY, 1, canvas.height);
        lineIndex = 0;
      }
    }

    const nc = nColumns > 2 ? 2 : nColumns;

    console.log("[gizual-app] [canvas-worker] draw finished");
    const blob = await canvas.convertToBlob();
    return { img: blob, width: `${nc * 300}px`, colors };
  }

  interpolateColor(updatedAt: number, fileContext: FileContext) {
    const timeRange: [number, number] = [
      fileContext.earliestTimestamp,
      fileContext.latestTimestamp,
    ];
    const colorRange: [string, string] = [
      fileContext.settings.colorOld,
      fileContext.settings.colorNew,
    ];

    return getColorScale(timeRange, colorRange)(updatedAt);
  }
}

expose(new CanvasWorker());
