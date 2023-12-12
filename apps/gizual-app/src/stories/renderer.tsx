import { getPrettyConsoleCSS, LINEAR_COLOR_RANGE } from "@app/utils";
import React from "react";

import {
  AuthorContribution,
  AuthorContributionsContext,
  AuthorMosaicContext,
  FileRendererWorker,
  RenderType,
} from "@giz/file-renderer";
import { GizDate } from "@giz/utils/gizdate";

import { testPackageJSON } from "./renderer.mock";

type Colors = {
  colorNewest: string;
  colorOldest: string;
};

type FileLinesProps = {
  type: RenderType.FileLines;
  visualizationStyle: "lineLength" | "full";
  showContent: boolean;
} & Colors;

type FileMosaicProps = {
  type: RenderType.FileMosaic;
  tilesPerRow: number;
} & Colors;

type AuthorMosaicProps = {
  type: RenderType.AuthorMosaic;
  strokeColor: string;
  strokeWidth: number;
  highlightLastModifiedByAuthor: boolean;
  tilesPerRow: number;
  mockFiles?: number;
} & Colors;

type AuthorContributionsProps = {
  type: RenderType.AuthorContributions;
  mockContributions?: number;
  numDays?: number;
} & Colors;

type FileBarProps = {
  type: RenderType.FileBar;
  mockValues?: number;
};

type AuthorBarProps = {
  type: RenderType.AuthorBar;
  mockValues?: number;
};

type RendererProps =
  | FileLinesProps
  | FileMosaicProps
  | AuthorMosaicProps
  | AuthorContributionsProps
  | FileBarProps
  | AuthorBarProps;

function prepareContext(props: RendererProps) {
  const colorNewest = "colorNewest" in props ? props.colorNewest : undefined;
  const colorOldest = "colorOldest" in props ? props.colorOldest : undefined;

  const baseContext = {
    ...testPackageJSON,
    visualizationConfig: {
      colors: {
        ...testPackageJSON.visualizationConfig.colors,
        newest: colorNewest ?? LINEAR_COLOR_RANGE[0],
        oldest: colorOldest ?? LINEAR_COLOR_RANGE[1],
      },
    },
    type: props.type,
  };

  if (props.type === RenderType.FileLines) {
    const { visualizationStyle, showContent } = props;
    baseContext.backgroundWidth = visualizationStyle;
    baseContext.visualizationConfig = {
      ...baseContext.visualizationConfig,
      style: {
        lineLength: visualizationStyle,
      },
    };
    baseContext.showContent = showContent;

    return baseContext;
  }

  if (props.type === RenderType.FileMosaic) {
    const { tilesPerRow } = props;
    baseContext.tilesPerRow = tilesPerRow;
    baseContext.rect = {
      ...baseContext.rect,
      height: 100,
    };
    return baseContext;
  }

  if (props.type === RenderType.AuthorMosaic) {
    const { strokeColor, strokeWidth, tilesPerRow, highlightLastModifiedByAuthor, mockFiles } =
      props;
    const prepareMockFiles = () => {
      const files = [];
      for (let i = 0; i < (mockFiles ?? 330); i++) {
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

      rect: {
        ...baseContext.rect,
        height: 200,
      },
    };
    return context;
  }

  if (props.type === RenderType.AuthorContributions) {
    const { mockContributions, numDays } = props;
    const startTime = 1_659_415_884;
    const startDate = new GizDate(startTime * 1000).discardTimeComponent();
    const endDate = startDate.addDays(numDays ?? 365).discardTimeComponent();

    const prepareMockContributions = () => {
      const contributions: AuthorContribution[] = [];

      for (let i = 0; i < (mockContributions ?? 100); i++) {
        const contributionTime =
          startDate.addDays(Math.floor(Math.random() * (numDays ?? 365))).getTime() / 1000;

        contributions.push({
          commitHash: `#hash${i}`,
          timestamp: `${contributionTime}`,
        });
      }
      return contributions;
    };
    const context: AuthorContributionsContext = {
      ...baseContext,
      type: props.type,
      contributions: prepareMockContributions(),
      selectedStartDate: startDate,
      selectedEndDate: endDate,
      rect: {
        ...baseContext.rect,
        width: 80,
      },
    };
    return context;
  }

  if (props.type === RenderType.FileBar) {
    const { mockValues } = props;
    const prepareMockValues = () => {
      const values: { id: string; value: number }[] = [];

      for (let i = 0; i < (mockValues ?? 10); i++) {
        values.push({
          id: `#hash${i}`,
          value: Math.floor(Math.random() * 100),
        });
      }
      return values;
    };

    const context: AuthorContributionsContext = {
      ...baseContext,
      type: props.type,
      values: prepareMockValues(),
      rect: {
        ...baseContext.rect,
        height: 15,
      },
    };
    return context;
  }
}

export function Renderer(props: RendererProps) {
  const renderer = useRenderer();
  const [imageSrc, setImageSrc] = React.useState<string>("");

  React.useEffect(() => {
    setImageSrc("");
    renderer?.draw(prepareContext(props), "canvas").then(({ result }) => {
      setImageSrc(result);
    });

    renderer?.draw(prepareContext(props), "annotations").then(({ result }) => {
      console.log(
        "%c%s %s",
        getPrettyConsoleCSS("#599810"),
        "[Storybook:Renderer]",
        "Annotation layer for:",
        props.type,
      );
      console.table(result);
    });
  }, [props]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h2>Rendered image:</h2>
      <div>
        {imageSrc === "" ? (
          <Loading />
        ) : (
          <img
            src={imageSrc}
            style={{ maxWidth: "70vw", maxHeight: "70vh", border: "2px solid black" }}
          ></img>
        )}
      </div>
    </div>
  );
}

function Loading() {
  return <div>Loading...</div>;
}

function useRenderer() {
  const [renderer] = React.useState<FileRendererWorker | null>(new FileRendererWorker());
  return renderer;
}

export default RendererProps;
