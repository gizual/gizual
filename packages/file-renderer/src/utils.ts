import type { Line } from "@app/controllers";
import {
  BAND_COLOR_RANGE,
  ColorManager,
  getBandColorScale,
  getColorScale,
} from "@app/utils/colors";
import ejs from "ejs";

import {
  FileLinesContext,
  FileMosaicContext,
  InternalContextItems,
  RendererContext,
} from "./types";

export function interpolateColor(
  line: Line,
  ctx: FileLinesContext | FileMosaicContext,
  colorManager?: ColorManager,
) {
  const updatedAtSeconds = +(line.commit?.timestamp ?? 0);

  // If the line was updated before the start or after the end date, grey it out.
  if (
    updatedAtSeconds * 1000 < ctx.selectedStartDate.getTime() ||
    updatedAtSeconds * 1000 > ctx.selectedEndDate.getTime()
  )
    return ctx.visualizationConfig.colors.notLoaded;

  if (ctx.coloringMode === "age") {
    const timeRange: [number, number] = [ctx.earliestTimestamp, ctx.latestTimestamp];
    const colorRange: [string, string] = [
      ctx.visualizationConfig.colors.oldest,
      ctx.visualizationConfig.colors.newest,
    ];

    return updatedAtSeconds
      ? getColorScale(timeRange, colorRange)(updatedAtSeconds)
      : ctx.visualizationConfig.colors.notLoaded;
  } else {
    const author = ctx.authors.find((a) => a.id === line.commit?.authorId);

    if (!colorManager)
      throw new Error("`interpolateColor` requires an instance of `ColorManager`.");

    return colorManager.getBandColor(author?.id ?? "");
  }
}

export function interpolateBandColor(values: string[], value: string) {
  return getBandColorScale(values, BAND_COLOR_RANGE)(value);
}

export function interpolateColorBetween(
  value: number,
  start: number,
  end: number,
  colors: [string, string],
) {
  const colorRange: [string, string] = colors;
  return getColorScale([start, end], colorRange)(value);
}

export function calculateDimensions(dpr: number, rect: DOMRect) {
  const width = rect.width * dpr;
  const height = rect.height * dpr;
  return { width, height };
}

export function getFillColor(ctx: RendererContext) {
  return "green";
}

function parseEjsTemplate(ctx: RendererContext) {
  const { ejsTemplate: template } = ctx;
  if (!template) return;

  let ejsContext = {};

  // Populate with all "allowed" context items that are not functions or internal.
  for (const [key, value] of Object.entries(ctx).filter(
    ([key, value]) => typeof value !== "function" && !InternalContextItems.includes(key as any),
  )) {
    ejsContext = {
      ...ejsContext,
      [key]: value,
    };
  }

  // Shift the context one level up to make it accessible in the template.
  ejsContext = { _: { ...ejsContext } };

  const ejsResult = ejs.render(template, ejsContext);
  console.log(
    "`parseEjsTemplate` (template, ctx, result)",
    template,
    ctx,
    ejsResult,
  ); /* TODO: Remove log */
  return ejsResult;
}
