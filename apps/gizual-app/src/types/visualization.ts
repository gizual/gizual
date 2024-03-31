export type VisualizationConfig = {
  colors: {
    oldest: string;
    newest: string;
  };
  style: {
    lineLength: "lineLength" | "full";
  };
  preferredColorScheme: "dark" | "light";
};
