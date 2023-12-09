import type { ColoringMode } from "@app/types";
import type { SvgBaseElement } from "@app/utils";

import type { Author } from "@giz/explorer";
import type { Line } from "@giz/gizual-app/controllers";
import type { VisualizationConfig } from "@giz/gizual-app/types";

export type RenderingMode = "canvas" | "svg" | "annotations";

export const InternalContextItems = ["dpr", "rect", "ejsTemplate"] as const;

export type InternalContext = {
  dpr: number;
  rect: DOMRect;
  ejsTemplate?: string;
};

export type BaseContext = {
  isPreview: boolean;
  visualizationConfig: VisualizationConfig;
  earliestTimestamp: number;
  latestTimestamp: number;
  selectedStartDate: Date;
  selectedEndDate: Date;
} & InternalContext;

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
  timestamp: string;
};

export enum RenderType {
  AuthorMosaic = "author-mosaic",
  AuthorContributions = "author-contributions",
  FileLines = "file-lines",
  FileMosaic = "file-mosaic",
  FileBar = "file-bar",
  AuthorBar = "author-bar",
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
  showContent: boolean;
} & BaseContext;

export type FileMosaicContext = {
  type: RenderType.FileMosaic;
  coloringMode: ColoringMode;
  fileContent: Omit<Line[], "content">; // We don't need the content, just the metadata
  authors: Author[];
} & BaseContext &
  BaseMosaicContext;

export type BarContext = {
  values: { id: string; value: number }[];
} & BaseContext;

export type FileBarContext = { type: RenderType.FileBar } & BarContext;
export type AuthorBarContext = { type: RenderType.AuthorBar } & BarContext;

export type RendererContext =
  | AuthorMosaicContext
  | AuthorContributionsContext
  | FileLinesContext
  | FileMosaicContext
  | FileBarContext
  | AuthorBarContext;

export function isContextOfType<T extends RendererContext>(
  ctx: RendererContext,
  type: RenderType,
): ctx is T {
  return ctx.type === type;
}

export type RenderingResult = Promise<string | SvgBaseElement[]>;
