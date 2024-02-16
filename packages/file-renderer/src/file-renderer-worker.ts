import { VisualizationDefaults } from "@app/utils/defaults";
import { SvgBaseElement, SvgElement } from "@app/utils/svg";
import { expose } from "comlink";

import { ColorManager } from "@giz/color-manager";
import iosevkaUrl from "@giz/fonts/Iosevka-Extended.woff2?url";
import {
  convertTimestampToMs,
  getDaysBetween,
  getStringDate,
  GizDate,
  isDateBetween,
} from "@giz/utils/gizdate";

import {
  AnnotationObject,
  AnnotationRenderer,
  BaseRenderer,
  CanvasRenderer,
  SvgRenderer,
  ValidContext,
} from "./renderer-backend";
import {
  AuthorContributionsContext,
  AuthorMosaicContext,
  BarContext,
  FileLinesContext,
  FileMosaicContext,
  RendererContext,
  RenderingMode,
  RenderType,
} from "./types";
import { calculateDimensions, interpolateBandColor } from "./utils";

export class FileRendererWorker {
  fontsPrepared = false;
  colorManager: ColorManager;

  constructor() {
    this.colorManager = new ColorManager();
  }

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

  async drawCanvas(fileCtx: RendererContext): Promise<{ result: string }> {
    return this.draw(fileCtx, "canvas");
  }

  async drawSingleSvg(fileCtx: RendererContext): Promise<{ result: SvgBaseElement[] }> {
    return this.draw(fileCtx, "svg");
  }

  async draw(
    fileCtx: RendererContext,
    mode: "canvas",
    renderCtx?: OffscreenCanvas,
  ): Promise<{ result: string }>;
  async draw(
    fileCtx: RendererContext,
    mode: "svg",
    renderCtx?: SvgElement,
  ): Promise<{ result: SvgBaseElement[] }>;
  async draw(
    fileCtx: RendererContext,
    mode: "annotations",
    renderCtx?: AnnotationObject[],
  ): Promise<{ result: AnnotationObject[] }>;
  async draw(ctx: RendererContext, mode: RenderingMode = "canvas", renderCtx?: ValidContext) {
    await this.prepareFont();

    let renderer: BaseRenderer | undefined;
    if (mode === "canvas") renderer = new CanvasRenderer();
    if (mode === "svg") renderer = new SvgRenderer();
    if (mode === "annotations") renderer = new AnnotationRenderer();
    if (!renderer) throw new Error("Renderer not initialized. Provided mode: " + mode);

    if (renderCtx) {
      renderer.assignContext(renderCtx);
    } else {
      renderer.prepareContext(ctx.rect.width, ctx.rect.height, ctx.dpr);
    }

    switch (ctx.type) {
      case RenderType.FileLines: {
        return this.drawFileLines(ctx, renderer);
      }
      case RenderType.FileMosaic: {
        return this.drawFileMosaic(ctx, renderer);
      }
      case RenderType.AuthorMosaic: {
        return this.drawAuthorMosaic(ctx, renderer);
      }
      case RenderType.AuthorContributions: {
        return this.drawAuthorContributionsGraph(ctx, renderer);
      }
      // TODO: Fix bar render type
      case RenderType.AuthorBar: {
        return this.drawBar(ctx, renderer);
      }
      case RenderType.FileBar: {
        return this.drawBar(ctx, renderer);
      }
      default: {
        console.log("Unknown render type:", ctx);
        throw new Error("Panic - Unknown render type!");
      }
    }
  }

  async drawAuthorMosaic(ctx: AuthorMosaicContext, renderer: BaseRenderer) {
    const { width, height } = calculateDimensions(ctx.dpr, ctx.rect);
    const numRows = Math.ceil(ctx.files.length / ctx.tilesPerRow);
    const rowHeight = height / numRows;
    const tileWidth = width / ctx.tilesPerRow;

    let currentX = 0;
    let currentY = 0;
    for (const file of ctx.files) {
      const color = this.colorManager.interpolateColor(ctx, file.modifiedAt);

      renderer.drawRect({
        x: currentX,
        y: currentY,
        width: tileWidth,
        height: rowHeight,
        fill: color,
      });

      currentX += tileWidth;
      if (currentX >= width) {
        currentX = 0;
        currentY += rowHeight;
      }
    }

    if (ctx.highlightLastModifiedByAuthor) {
      currentX = 0;
      currentY = 0;
      for (const file of ctx.files) {
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
        if (currentX >= width) {
          currentX = 0;
          currentY += rowHeight;
        }
      }
    }

    const result = await renderer.getReturnValue();
    return { result };
  }

  async drawAuthorContributionsGraph(ctx: AuthorContributionsContext, renderer: BaseRenderer) {
    const numDays = getDaysBetween(
      new GizDate(ctx.selectedStartDate),
      new GizDate(ctx.selectedEndDate),
    );
    const { width, height } = calculateDimensions(ctx.dpr, ctx.rect);
    const numTilesPerRow = 7; // one row per day of the week
    const numRows = Math.ceil(numDays / numTilesPerRow);
    const rowHeight = height / numRows;
    const tileWidth = width / numTilesPerRow;
    const startDate = new GizDate(ctx.selectedStartDate.getTime()).discardTimeComponent();
    const endDate = new GizDate(ctx.selectedEndDate.getTime()).discardTimeComponent();

    let currentX = 0;
    let currentY = 0;
    const contributionsPerDay: Map<string, number> = new Map();

    for (const contribution of ctx.contributions) {
      const contributionDay = new GizDate(convertTimestampToMs(contribution.timestamp));
      const dateString = getStringDate(contributionDay);

      if (isDateBetween(contributionDay, startDate, endDate)) {
        const existingContributions = contributionsPerDay.get(dateString) ?? 0;
        contributionsPerDay.set(dateString, existingContributions + 1);
      }
    }

    for (let day = 0; day < numDays; day++) {
      const currentDay = new GizDate(ctx.selectedStartDate.getTime())
        .addDays(day)
        .discardTimeComponent();

      const color = this.colorManager.interpolateColor(ctx, currentDay);

      for (
        let contribution = 0;
        contribution < (contributionsPerDay.get(getStringDate(currentDay)) ?? 0);
        contribution++
      ) {
        renderer.drawRect({
          x: currentX,
          y: currentY,
          width: tileWidth,
          height: rowHeight,
          fill: color,
        });
      }

      currentX += tileWidth;
      if (currentX >= width) {
        currentX = 0;
        currentY += rowHeight;
      }
    }

    const result = await renderer.getReturnValue();
    return { result };
  }

  async drawFileMosaic(ctx: FileMosaicContext, renderer: BaseRenderer) {
    const { width, height } = calculateDimensions(ctx.dpr, ctx.rect);
    const numRows = Math.ceil(ctx.fileContent.length / ctx.tilesPerRow);
    const rowHeight = height / numRows;
    const tileWidth = width / ctx.tilesPerRow;
    const colors: string[] = [];

    let currentX = 0;
    let currentY = 0;
    for (const [index, line] of ctx.fileContent.entries()) {
      if (index + 1 > VisualizationDefaults.maxLineCount) break;

      let color = ctx.visualizationConfig.colors.notLoaded;
      if (line.commit && !ctx.isPreview) color = this.colorManager.interpolateColor(ctx, line);

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
      if (currentX >= width) {
        currentX = 0;
        currentY += rowHeight;
      }
    }

    const result = await renderer.getReturnValue();
    return { result, colors };
  }

  async drawFileLines(ctx: FileLinesContext, renderer: BaseRenderer) {
    const colors: string[] = [];
    const { width } = calculateDimensions(ctx.dpr, ctx.rect);
    const lineHeight = 10 * ctx.dpr;
    this.colorManager.init(ctx.colorDefinition);

    let currentY = 0;
    const widthPerCharacter = width / ctx.lineLengthMax;

    for (const line of ctx.fileContent) {
      //if (index + 1 > VisualizationDefaults.maxLineCount) break;
      const lineLength = line.content.length;

      let rectWidth = width;
      let lineOffsetScaled = 0;

      if (ctx.visualizationConfig.style.lineLength === "lineLength") {
        lineOffsetScaled =
          (line.content.length - line.content.trimStart().length) * widthPerCharacter;
        rectWidth = Math.min(
          lineLength * widthPerCharacter - lineOffsetScaled,
          width - lineOffsetScaled,
        );
      }

      const color =
        line.commit && !ctx.isPreview
          ? this.colorManager.interpolateColor(ctx, line)
          : ctx.visualizationConfig.colors.notLoaded;

      line.color = color;
      colors.push(line.color ?? "#000");

      renderer.drawRect({
        x: lineOffsetScaled,
        y: currentY,
        width: rectWidth,
        height: lineHeight,
        fill: color,
      });

      if (ctx.showContent)
        renderer.drawText(line.content, {
          x: 0,
          y: currentY + Math.round(lineHeight / 1.5),
          fontSize: "4.1",
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

  async drawBar(ctx: BarContext, renderer: BaseRenderer) {
    const colors: string[] = [];
    const { width, height } = calculateDimensions(ctx.dpr, ctx.rect);

    const total = ctx.values.reduce((acc, val) => acc + val.value, 0);

    let currentX = 0;
    for (const value of ctx.values) {
      const percentage = value.value / total;
      const color = interpolateBandColor(
        ctx.values.map((v) => v.id),
        value.id,
      );

      renderer.drawRect({
        x: currentX,
        y: 0,
        width: width * percentage,
        height: height,
        fill: color,
      });

      currentX += width * percentage;
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
