import { expose } from "comlink";

import iosevkaUrl from "@giz/fonts/Iosevka-Extended.woff2?url";
import { SvgBaseElement } from "@giz/gizual-app/utils";

import { BaseRenderer, CanvasRenderer, SvgRenderer } from "./file-renderer";
import { VisualizationDefaults } from "./file-renderer";
import { FileLinesContext, RendererContext, RenderingMode, RenderType } from "./types";
import { interpolateColor } from "./utils";

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
  async draw(fileCtx: RendererContext, mode: RenderingMode = "canvas") {
    await this.prepareFont();

    let renderer: CanvasRenderer | SvgRenderer | undefined;
    if (mode === "canvas") renderer = new CanvasRenderer();
    if (mode === "svg") renderer = new SvgRenderer();
    if (!renderer) throw new Error("Renderer not initialized. Provided mode: " + mode);

    renderer.prepareContext(fileCtx.rect.width, fileCtx.rect.height, fileCtx.dpr);

    switch (fileCtx.type) {
      case RenderType.FileLines: {
        return this.drawFilesLines(fileCtx, renderer);
      }
    }

    console.log(fileCtx);
  }

  async drawFilesLines(fileCtx: FileLinesContext, renderer: BaseRenderer) {
    const colors: string[] = [];

    const lineHeight = 10 * fileCtx.dpr;

    const currentX = 0;
    let currentY = 0;

    const scaledCanvasWidth = fileCtx.rect.width * fileCtx.dpr;

    const widthPerCharacter = scaledCanvasWidth / VisualizationDefaults.maxLineLength;

    for (const [index, line] of fileCtx.fileContent.entries()) {
      if (index + 1 > VisualizationDefaults.maxLineCount) break;
      const lineLength = line.content.length;

      let rectWidth = scaledCanvasWidth;
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
          ? interpolateColor(line, fileCtx)
          : fileCtx.visualizationConfig.colors.notLoaded;

      line.color = color;
      colors.push(line.color ?? "#000");

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
}

if (typeof self !== "undefined" && typeof window === "undefined") {
  // only expose in a worker
  expose(new FileRendererWorker());
}
