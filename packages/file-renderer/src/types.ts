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
};

export type BaseMosaicContext = {
  tilesPerRow: number;
};

export type FileInfo = {
  name: string;
};

export type AuthorContribution = {
  commitHash: string;
  timestamp: number;
};

export enum RenderType {
  AuthorMosaic = "author-mosaic",
  AuthorContributions = "author-contributions",
  FileLines = "file-lines",
}

export type AuthorContributionsContext = {
  type: RenderType.AuthorContributions;
  contributions: AuthorContribution[];
} & BaseContext;

export type AuthorMosaicContext = {
  type: RenderType.AuthorMosaic;
  files: FileInfo;
} & BaseContext &
  BaseMosaicContext;

export type FileLinesContext = {
  type: RenderType.FileLines;
  fileContent: Line[];
  earliestTimestamp: number;
  latestTimestamp: number;
  lineLengthMax: number;
  coloringMode: ColoringMode;
  selectedStartDate: Date;
  selectedEndDate: Date;
  authors: Author[];
} & BaseContext;

export type RendererContext = AuthorMosaicContext | AuthorContributionsContext | FileLinesContext;

export type RenderingResult = Promise<string | SvgBaseElement[]>;
