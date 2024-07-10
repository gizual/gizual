export type VisualizationConfig = {
  colors: {
    oldest: string;
    newest: string;
    outOfRangeLight: string;
    outOfRangeDark: string;
  };
  style: {
    lineLength: "lineLength" | "full";
  };
  preferredColorScheme: "dark" | "light";
};
