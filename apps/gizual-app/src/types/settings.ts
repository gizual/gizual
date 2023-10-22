export const ColoringModes = ["age", "author"] as const;
export type ColoringMode = (typeof ColoringModes)[number];
export const ColoringModeLabels: Record<ColoringMode, string> = {
  age: "By Age",
  author: "By Author",
};
