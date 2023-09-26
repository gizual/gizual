export const ColouringModes = ["age", "author"] as const;
export type ColouringMode = (typeof ColouringModes)[number];
export const ColouringModeLabels: Record<ColouringMode, string> = {
  age: "By Age",
  author: "By Author",
};
