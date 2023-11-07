import { ScaleLinear, scaleLinear, ScaleOrdinal, scaleOrdinal } from "d3-scale";

export const LINEAR_COLOR_RANGE: [string, string] = ["#581c87", "#f0abfc"];
export const BAND_COLOR_RANGE: string[] = [
  "#40DFEF",
  "#A760FF",
  "#E4AEC5",
  "#FDD7AA",
  "#B4FF9F",
  "#F24C4C",
  "#FFF323",
  "#8FBDD3",
  "#9EB23B",
  "#14C38E",
  "#9BA3EB",
  "#FF0075",
  "#C65D7B",
  "#CC9544",
  "#6ECB63",
  "#E60965",
  "#E900FF",
  "#F47C7C",
  "#F90716",
  "#49FF00",
  "#CDF2CA",
  "#FFA500",
  "#525E75",
  "#7D1E6A",
  "#BD4291",
  "#874356",
  "#371B58",
  "#590696",
  "#1363DF",
  "#125B50",
  "#733C3C",
  "#0F00FF",
  "#041C32",
  "#001E6C",
];

export const SPECIAL_COLORS = {
  NOT_LOADED: "#232323",
};

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

export function parseRgbString(rgb: string): [number, number, number] {
  const [r, g, b] = rgb.split(",").map((c) => Number.parseInt(c));
  return [r, g, b];
}

function componentToHex(c: number) {
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

export function convertRgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((c) => componentToHex(c)).join("")}`;
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
