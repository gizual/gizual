type RendererProps = {
  type: RenderType;
  colorNewest: string;
  colorOldest: string;
  visualizationStyle?: "lineLength" | "full";
  tilesPerRow?: number;
  strokeColor?: string;
  strokeWidth?: number;
  highlightLastModifiedByAuthor?: boolean;
};

export default RendererProps;

import { LINEAR_COLOR_RANGE } from "@app/utils";
import React from "react";

import { AuthorMosaicContext, FileRendererWorker, RenderType } from "@giz/file-renderer";

import { testPackageJSON } from "./renderer.mock";

function prepareContext(props: RendererProps) {
  const {
    colorNewest,
    colorOldest,
    visualizationStyle,
    tilesPerRow,
    strokeColor,
    strokeWidth,
    highlightLastModifiedByAuthor,
  } = props;
  const baseContext = {
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
    type: props.type,
  };

  if (props.type === RenderType.FileLines) {
    baseContext.backgroundWidth = visualizationStyle;
    return baseContext;
  }

  if (props.type === RenderType.FileMosaic) {
    baseContext.tilesPerRow = tilesPerRow;
    return baseContext;
  }

  if (props.type === RenderType.AuthorMosaic) {
    const prepareMockFiles = () => {
      const files = [];
      for (let i = 0; i < 330; i++) {
        const startTime = 1_659_415_884;
        const endTime = 1_679_415_884;
        const diff = endTime - startTime;
        files.push({
          name: `Mock File #${i}`,
          modifiedAt: startTime + Math.floor(Math.random() * diff),
          createdAt: startTime + Math.floor(Math.random() * diff),
          lastModifiedByAuthor: Math.random() > 0.5,
        });
      }
      return files;
    };
    const context: AuthorMosaicContext = {
      ...testPackageJSON,
      type: props.type,
      strokeColor: strokeColor,
      strokeWidth: strokeWidth,
      highlightLastModifiedByAuthor: highlightLastModifiedByAuthor,
      tilesPerRow: tilesPerRow ?? 20,
      files: prepareMockFiles(),
    };
    return context;
  }
}

export function Renderer(props: RendererProps) {
  const renderer = useRenderer();
  const [imageSrc, setImageSrc] = React.useState<string>("");

  React.useEffect(() => {
    setImageSrc("");
    renderer?.draw(prepareContext(props), "canvas").then(({ result, colors }) => {
      setImageSrc(result);
    });
  }, [props]);

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
