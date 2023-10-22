export type VisualizationConfig = {
  colors: {
    oldest: string;
    newest: string;
    notLoaded: string;
  };
  style: {
    lineLength: "lineLength" | "full";
  };
};
