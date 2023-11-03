import { Line } from "@app/controllers";

import { BAND_COLOR_RANGE, getBandColorScale, getColorScale } from "@giz/gizual-app/utils";

import type { FileLinesContext, FileMosaicContext } from "./types";

export function interpolateColor(line: Line, ctx: FileLinesContext | FileMosaicContext) {
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
    const author = ctx.authors.find((a) => a.id === line.commit?.aid);
    return getBandColorScale(
      ctx.authors.map((a) => a.id),
      BAND_COLOR_RANGE,
    )(author?.id ?? "");
  }
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
