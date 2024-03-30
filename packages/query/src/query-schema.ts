import { Static, Type } from "@sinclair/typebox";

// Basic helper types
const StringOrArray = Type.Union([Type.Array(Type.String()), Type.String()]);
const StringOrTuple = Type.Union([
  Type.Array(Type.String(), { minItems: 2, maxItems: 2 }),
  Type.String(),
]);

// Available query conditions for `files`
const AvailableFilesQueryConditions = [
  Type.Object({ path: StringOrArray }),
  Type.Object({
    lastEditedBy: StringOrArray,
  }),
  Type.Object({ editedBy: StringOrArray }),
  Type.Object({ createdBy: StringOrArray }),
  Type.Object({ changedInRef: StringOrArray }),
  Type.Object({ contains: StringOrArray }),
];

const ExclusiveFilesQueryCondition = Type.Union(AvailableFilesQueryConditions);
const LogicalFilesQuery = Type.Array(ExclusiveFilesQueryCondition, { minItems: 2 });

const FilesQuery = Type.Union([
  ...AvailableFilesQueryConditions,
  Type.Object({ $and: LogicalFilesQuery }),
  Type.Object({ $or: LogicalFilesQuery }),
  Type.Object({ $not: ExclusiveFilesQueryCondition }),
]);

// Available query conditions for `time`
const AvailableTimeQueryConditions = [
  Type.Object({ sinceFirstCommitBy: Type.String() }),
  Type.Object({ rangeByDate: StringOrTuple }),
  Type.Object({ rangeByRef: StringOrTuple }),
];

const TimeQuery = Type.Union(AvailableTimeQueryConditions);

// Available query conditions for `highlights`
const Styles = Type.Object({
  fill: Type.Optional(Type.String()),
  $if: Type.Optional(Type.String()),
  stroke: Type.Optional(Type.String()),
});

const StylesQuery = Type.Array(Styles);

const RenderType = Type.Union([
  Type.Literal("author-mosaic"),
  Type.Literal("author-contributions"),
  Type.Literal("file-lines"),
  Type.Literal("file-lines-full"),
  Type.Literal("file-mosaic"),
  Type.Literal("file-bar"),
  Type.Literal("author-bar"),
]);

const AvailablePresetConditions = [
  Type.Object({ gradientByAge: Type.Array(Type.String(), { minItems: 2, maxItems: 2 }) }),
  Type.Object({ paletteByAuthor: Type.Array(Type.Tuple([Type.String(), Type.String()])) }),
];

const PresetQuery = Type.Union(AvailablePresetConditions);

export const SearchQuery = Type.Object({
  branch: Type.String(),
  type: RenderType,
  preset: Type.Optional(PresetQuery),
  time: Type.Optional(TimeQuery),
  files: Type.Optional(FilesQuery),
  styles: Type.Optional(StylesQuery),
});

export type SearchQueryType = Static<typeof SearchQuery>;
export type SearchQueryKeys = keyof SearchQueryType;
export type TimeQueryType = Static<typeof TimeQuery>;
export type RenderTypeQueryType = Static<typeof RenderType>;
export type PresetQueryType = Static<typeof PresetQuery>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type PresetQueryKeys = KeysOfUnion<PresetQueryType>;

export function getSchema(): any {
  return { ...Type.Strict(SearchQuery), additionalProperties: false };
}
