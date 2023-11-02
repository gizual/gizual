import { Line } from "@app/controllers";

import { BAND_COLOR_RANGE, getBandColorScale, getColorScale } from "@giz/gizual-app/utils";

import type { FileLinesContext } from "./types";

export function interpolateColor(line: Line, fileContext: FileLinesContext) {
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
    const author = fileContext.authors.find((a) => a.id === line.commit?.aid);
    return getBandColorScale(
      fileContext.authors.map((a) => a.id),
      BAND_COLOR_RANGE,
    )(author?.id ?? "");
  }
}
