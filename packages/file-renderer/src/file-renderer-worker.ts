import { expose } from "comlink";

import iosevkaUrl from "@giz/fonts/Iosevka-Extended.woff2?url";
import { SvgBaseElement } from "@giz/gizual-app/utils";

import { BaseRenderer, CanvasRenderer, SvgRenderer } from "./file-renderer";
import { VisualizationDefaults } from "./file-renderer";
import {
  AuthorMosaicContext,
  FileLinesContext,
  FileMosaicContext,
  RendererContext,
  RenderingMode,
  RenderType,
} from "./types";
import { interpolateColor, interpolateColorBetween } from "./utils";

export class FileRendererWorker {
  fontsPrepared = false;

  constructor() {}

  //async registerCanvas(canvas: OffscreenCanvas) {
  //  this._offscreen = canvas;
  //}

  async prepareFont() {
    if (this.fontsPrepared) return;
    this.fontsPrepared = true;
    if (self.FontFace && (self as any).fonts) {
      const fontFace = new FontFace(
        "Iosevka Extended",
        `local('Iosevka Extended'), url(${iosevkaUrl}) format('woff2')`,
      );
      // add it to the list of fonts our worker supports
      (self as any).fonts.add(fontFace);
      // load the font
      return fontFace.load();
    }
  }

  async drawCanvas(fileCtx: RendererContext): Promise<{ result: string; colors: string[] }> {
    return this.draw(fileCtx, "canvas");
  }

  async drawSingleSvg(
    fileCtx: RendererContext,
  ): Promise<{ result: SvgBaseElement[]; colors: string[] }> {
    return this.draw(fileCtx, "svg");
  }

  async draw(
    fileCtx: RendererContext,
    mode: "canvas",
  ): Promise<{ result: string; colors: string[] }>;
  async draw(
    fileCtx: RendererContext,
    mode: "svg",
  ): Promise<{ result: SvgBaseElement[]; colors: string[] }>;
  async draw(ctx: RendererContext, mode: RenderingMode = "canvas") {
    await this.prepareFont();

    let renderer: CanvasRenderer | SvgRenderer | undefined;
    if (mode === "canvas") renderer = new CanvasRenderer();
    if (mode === "svg") renderer = new SvgRenderer();
    if (!renderer) throw new Error("Renderer not initialized. Provided mode: " + mode);

    renderer.prepareContext(ctx.rect.width, ctx.rect.height, ctx.dpr);

    switch (ctx.type) {
      case RenderType.FileLines: {
        return this.drawFilesLines(ctx, renderer);
      }
      case RenderType.FileMosaic: {
        return this.drawFileMosaic(ctx, renderer);
      }
      case RenderType.AuthorMosaic: {
        return this.drawAuthorMosaic(ctx, renderer);
      }
    }
  }

  async drawAuthorMosaic(ctx: AuthorMosaicContext, renderer: BaseRenderer) {
    const rowHeight = 10 * ctx.dpr;
    const canvasWidth = ctx.rect.width * ctx.dpr;
    const tileWidth = canvasWidth / ctx.tilesPerRow;
    const colors: string[] = [];

    let currentX = 0;
    let currentY = 0;
    for (const [index, file] of ctx.files.entries()) {
      const color = interpolateColorBetween(
        file.modifiedAt * 1000,
        ctx.selectedStartDate.getTime(),
        ctx.selectedEndDate.getTime(),
        [ctx.visualizationConfig.colors.oldest, ctx.visualizationConfig.colors.newest],
      );

      colors.push(color);

      renderer.drawRect({
        x: currentX,
        y: currentY,
        width: tileWidth,
        height: rowHeight,
        fill: color,
      });

      currentX += tileWidth;
      if (currentX >= canvasWidth) {
        currentX = 0;
        currentY += rowHeight;
      }
    }

    if (ctx.highlightLastModifiedByAuthor) {
      currentX = 0;
      currentY = 0;
      for (const [index, file] of ctx.files.entries()) {
        renderer.drawRect({
          x: currentX,
          y: currentY,
          width: tileWidth,
          height: rowHeight,
          fill: undefined,
          stroke: file.lastModifiedByAuthor ? ctx.strokeColor : undefined,
          strokeWidth: `${ctx.strokeWidth * ctx.dpr}`,
        });

        currentX += tileWidth;
        if (currentX >= canvasWidth) {
          currentX = 0;
          currentY += rowHeight;
        }
      }
    }

    const result = await renderer.getReturnValue();
    return { result, colors };
  }

  async drawFileMosaic(ctx: FileMosaicContext, renderer: BaseRenderer) {
    const rowHeight = 10 * ctx.dpr;
    const canvasWidth = ctx.rect.width * ctx.dpr;
    const tileWidth = canvasWidth / ctx.tilesPerRow;
    const colors: string[] = [];

    let currentX = 0;
    let currentY = 0;
    for (const [index, line] of ctx.fileContent.entries()) {
      if (index + 1 > VisualizationDefaults.maxLineCount) break;

      const color =
        line.commit && !ctx.isPreview
          ? interpolateColor(line, ctx)
          : ctx.visualizationConfig.colors.notLoaded;

      line.color = color;
      colors.push(line.color ?? "#000");

      renderer.drawRect({
        x: currentX,
        y: currentY,
        width: tileWidth,
        height: rowHeight,
        fill: color,
        stroke: "black",
        strokeWidth: "1",
      });

      currentX += tileWidth;
      if (currentX >= canvasWidth) {
        currentX = 0;
        currentY += rowHeight;
      }
    }

    const result = await renderer.getReturnValue();
    return { result, colors };
  }

  async drawFilesLines(fileCtx: FileLinesContext, renderer: BaseRenderer) {
    const colors: string[] = [];

    const lineHeight = 10 * fileCtx.dpr;

    let currentY = 0;

    const scaledCanvasWidth = fileCtx.rect.width * fileCtx.dpr;

    const widthPerCharacter = scaledCanvasWidth / VisualizationDefaults.maxLineLength;

    for (const [index, line] of fileCtx.fileContent.entries()) {
      if (index + 1 > VisualizationDefaults.maxLineCount) break;
      const lineLength = line.content.length;

      let rectWidth = scaledCanvasWidth;
      let lineOffsetScaled = 0;

      if (fileCtx.backgroundWidth === "lineLength") {
        lineOffsetScaled =
          (line.content.length - line.content.trimStart().length) * widthPerCharacter;
        rectWidth = Math.min(
          lineLength * widthPerCharacter - lineOffsetScaled,
          scaledCanvasWidth - lineOffsetScaled,
        );
      }

      const color =
        line.commit && !fileCtx.isPreview
          ? interpolateColor(line, fileCtx)
          : fileCtx.visualizationConfig.colors.notLoaded;

      line.color = color;
      colors.push(line.color ?? "#000");

      renderer.drawRect({
        x: lineOffsetScaled,
        y: currentY,
        width: rectWidth,
        height: lineHeight,
        fill: color,
      });
      renderer.drawText(line.content, {
        x: 0,
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
}

if (typeof self !== "undefined" && typeof window === "undefined") {
  // only expose in a worker
  expose(new FileRendererWorker());
}
