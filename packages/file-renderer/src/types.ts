import type { ColoringMode } from "@app/types";
import { SvgBaseElement } from "@app/utils";

import type { Author } from "@giz/explorer";
import type { Line } from "@giz/gizual-app/controllers";
import type { VisualizationConfig } from "@giz/gizual-app/types";

export type RenderingMode = "canvas" | "svg";

export type BaseContext = {
  dpr: number;
  rect: DOMRect;
  isPreview: boolean;
  visualizationConfig: VisualizationConfig;

  earliestTimestamp: number;
  latestTimestamp: number;
  selectedStartDate: Date;
  selectedEndDate: Date;
};

export type BaseMosaicContext = {
  tilesPerRow: number;
};

export type FileInfo = {
  name: string;
  modifiedAt: number;
  createdAt: number;
  lastModifiedByAuthor: boolean;
};

export type AuthorContribution = {
  commitHash: string;
  timestamp: number;
};

export enum RenderType {
  AuthorMosaic = "author-mosaic",
  AuthorContributions = "author-contributions",
  FileLines = "file-lines",
  FileMosaic = "file-mosaic",
}

export type AuthorContributionsContext = {
  type: RenderType.AuthorContributions;
  contributions: AuthorContribution[];
} & BaseContext;

export type AuthorMosaicContext = {
  type: RenderType.AuthorMosaic;
  files: FileInfo[];
  strokeColor: string;
  strokeWidth: number;
  highlightLastModifiedByAuthor: boolean;
} & BaseContext &
  BaseMosaicContext;

export type FileLineBackgroundWidth = "full" | "lineLength";
export type FileLinesContext = {
  type: RenderType.FileLines;
  backgroundWidth: FileLineBackgroundWidth;
  fileContent: Line[];
  lineLengthMax: number;
  coloringMode: ColoringMode;
  authors: Author[];
} & BaseContext;

export type FileMosaicContext = {
  type: RenderType.FileMosaic;
  coloringMode: ColoringMode;
  fileContent: Omit<Line[], "content">; // We don't need the content, just the metadata
  authors: Author[];
} & BaseContext &
  BaseMosaicContext;

export type RendererContext =
  | AuthorMosaicContext
  | AuthorContributionsContext
  | FileLinesContext
  | FileMosaicContext;

export type RenderingResult = Promise<string | SvgBaseElement[]>;
