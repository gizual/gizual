import { hcl, HCLColor } from "d3-color";
import { ScaleLinear, scaleLinear, ScaleOrdinal, scaleOrdinal } from "d3-scale";

import type {
  AuthorContributionsContext,
  AuthorMosaicContext,
  FileLinesContext,
  FileMosaicContext,
  RendererContext,
} from "@giz/file-renderer";
import type { Line } from "@giz/gizual-app/controllers";
import { GizDate } from "@giz/utils/gizdate";

import { BAND_COLOR_RANGE, LINEAR_COLOR_RANGE } from "./presets";

export const getColorScale = (
  domain: [number, number],
  colorRange: [string, string] = [LINEAR_COLOR_RANGE[0], LINEAR_COLOR_RANGE[1]],
): ScaleLinear<string, string, never> => scaleLinear<string>().range(colorRange).domain(domain);

export const getBandColorScale = (
  domain: string[],
  colorRange: string[],
): ScaleOrdinal<string, string, never> => scaleOrdinal<string>().range(colorRange).domain(domain);

// Returns the euclidean distance between two color values.
// Does not account for human color perception differences.
// See: https://en.wikipedia.org/wiki/Color_difference
export function checkColorSimilarity(a: string, b: string): number {
  const [r1, g1, b1] = parseRgbString(a);
  const [r2, g2, b2] = parseRgbString(b);

  const distSq = Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2);
  return Math.sqrt(distSq);
}

export function parseRgbString(rgb: string): [number, number, number, number] {
  const [r, g, b, a] = rgb.match(/\d+/g)!.map(Number);

  if (a === undefined) return [r, g, b, 1];
  return [r, g, b, a];
}

function componentToHex(c = 0) {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function convertHexToRgbA(hex: string): [number, number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  if (hex.length === 7) {
    return [r, g, b, 1];
  }

  const a = Number.parseInt(hex.slice(7, 9), 16) / 255;
  return [r, g, b, a];
}

export function convertRgbToHex(rgbA: [number, number, number, number]): string {
  const alpha = rgbA[3];
  const rgb = rgbA.slice(0, 3);

  return `#${rgb.map((c) => componentToHex(c)).join("")}${
    alpha === 1 ? "" : componentToHex(Math.round(alpha * 255))
  }`;
}

export function mulberry32(seed: number) {
  return function () {
    // eslint-disable-next-line unicorn/number-literal-case
    let t = (seed += 0x6d_2b_79_f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

// If the hex value has no alpha channel, add it with a default transparency.
// Otherwise, use the value as is.
export function enforceAlphaChannel(hex: string): string {
  const [r, g, b, a] = convertHexToRgbA(hex);
  const transparentA = Math.min(a, 0.4);
  const out = `rgba(${r},${g},${b},${transparentA})`;
  return out;
}

export type ColorSetDefinition = {
  excludedColors?: string[];
  assignedColors?: [string, string][];
  domain?: string[];
  bandLength?: number;
};

/**
 * Manages the color selection for a specific domain of values.
 */
export class ColorManager {
  // The band of all colors that are available for default use.
  colorBand: string[] = [];

  // Ordinal scale that maps identifiers to colors.
  colorScale?: ScaleOrdinal<string, string, never>;

  // The target domain of the color band.
  domain: string[] = [];

  // Colors the user has explicitly excluded from the color band.
  excludedColors: HCLColor[] = [];

  // Colors the user has explicitly assigned to a specific identifier.
  assignedColors: Map<string, string> = new Map();

  // The length of the color band
  bandLength = 8;

  constructor(ctx?: ColorSetDefinition) {
    if (ctx) this.init(ctx);
  }

  init({ excludedColors, assignedColors, domain, bandLength }: ColorSetDefinition) {
    if (excludedColors) for (const c of excludedColors) this.excludeColor(c);
    if (assignedColors) this.assignedColors = new Map(assignedColors);
    if (domain && domain.length > 0) this.domain = domain;

    if (bandLength) this.bandLength = bandLength;
    else if (domain && domain.length > 0) this.bandLength = Math.min(domain.length, 30);

    this.initializeColorBand();
  }

  get state(): ColorSetDefinition {
    return {
      excludedColors: this.excludedColors.map((c) => c.toString()),
      assignedColors: [...this.assignedColors.entries()],
      domain: [...this.domain],
      bandLength: this.bandLength,
    };
  }

  assignColor(identifier: string, color: string) {
    this.assignedColors.set(identifier, color);
  }

  excludeColor(color: string) {
    this.excludedColors.push(ColorManager.stringToHcl(color));
    this.initializeColorBand();
  }

  get isInitialized() {
    return this.colorBand.length > 0;
  }

  /** Creates a set of perceptually uniform colors for default use */
  initializeColorBand() {
    this.colorBand = [];
    for (let i = 0; i < this.bandLength; i++) {
      const hclColor = hcl((i * 360) / this.bandLength, 70, 65);
      if (!this.excludedColors.includes(hclColor)) this.colorBand.push(hclColor.toString());
    }

    this.colorScale = getBandColorScale(this.domain, this.colorBand);
  }

  getBandColor(identifier: string): string {
    if (this.assignedColors.has(identifier)) {
      return this.assignedColors.get(identifier)!;
    }
    if (!this.colorScale) throw new Error("No color scale was initialized.");

    return this.colorScale(identifier);
  }

  static stringToHcl(color: string): HCLColor {
    return hcl(color);
  }

  static hclToRgb(color: HCLColor): string {
    return color.toString();
  }

  static stringToHex(color: string): string {
    return convertRgbToHex(parseRgbString(color));
  }

  static interpolateColorBetween(
    value: number,
    start: number,
    end: number,
    colors: [string, string],
  ) {
    const colorRange: [string, string] = colors;
    return getColorScale([start, end], colorRange)(value);
  }

  static interpolateBandColorBetween(value: string, values: string[]) {
    return getBandColorScale(values, BAND_COLOR_RANGE)(value);
  }

  interpolateColor(ctx: AuthorContributionsContext, value: GizDate): string;
  interpolateColor(ctx: FileLinesContext, value: Line): string;
  interpolateColor(ctx: FileMosaicContext, value: Line): string;
  interpolateColor(ctx: AuthorMosaicContext, value: number): string;
  interpolateColor(ctx: RendererContext, value: any): string {
    switch (ctx.type) {
      case "file-lines": {
        return this.interpolateLineColor(ctx, value);
      }
      case "author-contributions": {
        return this.interpolateContributionColor(ctx, value);
      }
      case "author-mosaic": {
        return this.interpolateAuthorMosaicColor(ctx, value);
      }
      case "file-mosaic": {
        return this.interpolateFileMosaicColor(ctx, value);
      }
    }

    return ctx.visualizationConfig.colors.notLoaded;
  }

  private interpolateLineColor(ctx: RequiredColorInfo, line: Line) {
    const updatedAtSeconds = +(line.commit?.timestamp ?? 0);

    // If the line was updated before the start or after the end date, grey it out.
    if (
      updatedAtSeconds * 1000 < ctx.selectedStartDate.getTime() ||
      updatedAtSeconds * 1000 > ctx.selectedEndDate.getTime()
    )
      return ctx.visualizationConfig.colors.notLoaded;

    switch (ctx.coloringMode) {
      case "age": {
        return this.interpolateLineColorByAge(ctx, line);
      }
      case "author": {
        return this.interpolateLineColorByAuthor(line);
      }
    }
  }

  private interpolateLineColorByAge(ctx: RequiredColorInfo, line: Line) {
    const updatedAtSeconds = +(line.commit?.timestamp ?? 0);

    const timeRange: [number, number] = [ctx.earliestTimestamp, ctx.latestTimestamp];
    const colorRange: [string, string] = [
      ctx.visualizationConfig.colors.oldest,
      ctx.visualizationConfig.colors.newest,
    ];

    return updatedAtSeconds
      ? getColorScale(timeRange, colorRange)(updatedAtSeconds)
      : ctx.visualizationConfig.colors.notLoaded;
  }

  private interpolateLineColorByAuthor(line: Line) {
    return this.getBandColor(line.commit?.authorId ?? "");
  }

  private interpolateContributionColor(ctx: AuthorContributionsContext, contributionTime: GizDate) {
    const startDate = new GizDate(ctx.selectedStartDate.getTime()).discardTimeComponent();
    const endDate = new GizDate(ctx.selectedEndDate.getTime()).discardTimeComponent();

    return ColorManager.interpolateColorBetween(
      contributionTime.getTime(),
      startDate.getTime(),
      endDate.getTime(),
      [
        enforceAlphaChannel(ctx.visualizationConfig.colors.oldest),
        enforceAlphaChannel(ctx.visualizationConfig.colors.newest),
      ],
    );
  }

  private interpolateAuthorMosaicColor(ctx: AuthorMosaicContext, modificationTime: number) {
    return ColorManager.interpolateColorBetween(
      modificationTime * 1000,
      ctx.selectedStartDate.getTime(),
      ctx.selectedEndDate.getTime(),
      [ctx.visualizationConfig.colors.oldest, ctx.visualizationConfig.colors.newest],
    );
  }

  private interpolateFileMosaicColor(ctx: FileMosaicContext, line: Line) {
    return this.interpolateLineColor(ctx, line);
  }
}

type RequiredColorInfo = Pick<
  FileLinesContext,
  | "selectedStartDate"
  | "selectedEndDate"
  | "visualizationConfig"
  | "coloringMode"
  | "earliestTimestamp"
  | "latestTimestamp"
  | "authors"
>;
