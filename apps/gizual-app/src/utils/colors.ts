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

export const getColorScale = (
  domain: [number, number],
  colorRange: [string, string] = [LINEAR_COLOR_RANGE[0], LINEAR_COLOR_RANGE[1]]
): ScaleLinear<string, string, never> => scaleLinear<string>().range(colorRange).domain(domain);

export const getBandColorScale = (
  domain: string[],
  colorRange: string[]
): ScaleOrdinal<string, string, never> => scaleOrdinal<string>().range(colorRange).domain(domain);