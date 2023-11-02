type RendererProps = {
  type: "file-lines";
  colorNewest: string;
  colorOldest: string;
  visualizationStyle: "lineLength" | "full";
};

export default RendererProps;

import { LINEAR_COLOR_RANGE } from "@app/utils";
import React from "react";

import { FileLinesContext, FileRendererWorker, RenderType } from "@giz/file-renderer";

import { testPackageJSON } from "./renderer.mock";

function prepareContext(props: RendererProps): FileLinesContext {
  const { colorNewest, colorOldest, visualizationStyle } = props;
  return {
    ...testPackageJSON,
    visualizationConfig: {
      colors: {
        ...testPackageJSON.visualizationConfig.colors,
        newest: colorNewest ?? LINEAR_COLOR_RANGE[0],
        oldest: colorOldest ?? LINEAR_COLOR_RANGE[1],
      },
      style: {
        lineLength: visualizationStyle ?? "lineLength",
      },
    },
    type: RenderType.FileLines,
  };
}

export function Renderer(props: RendererProps) {
  const renderer = useRenderer();
  const [imageSrc, setImageSrc] = React.useState<string>("");

  React.useEffect(() => {
    renderer?.draw(prepareContext(props), "canvas").then(({ result, colors }) => {
      setImageSrc(result);
    });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h2>Rendered image:</h2>
      <div style={{ border: "2px solid black" }}>
        {imageSrc === "" ? (
          <Loading />
        ) : (
          <img src={imageSrc} style={{ maxWidth: "70vw", maxHeight: "70vh" }}></img>
        )}
      </div>
    </div>
  );
}

function Loading() {
  return <div>Loading...</div>;
}

function useRenderer() {
  const [renderer, _] = React.useState<FileRendererWorker | null>(new FileRendererWorker());
  return renderer;
}
