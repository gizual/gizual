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
  Type.Object({ changedInRef: StringOrArray }),
  Type.Object({ contains: StringOrArray }),
];

const FilesQuery = Type.Union(AvailableFilesQueryConditions);

// Available query conditions for `time`
const AvailableTimeQueryConditions = [
  Type.Object({ sinceFirstCommitBy: Type.String() }),
  Type.Object({ rangeByDate: StringOrTuple }),
  Type.Object({ rangeByRef: StringOrTuple }),
];

const TimeQuery = Type.Union(AvailableTimeQueryConditions);

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
});

export type SearchQueryType = Static<typeof SearchQuery>;
export type SearchQueryKeys = keyof SearchQueryType;
export type TimeQueryType = Static<typeof TimeQuery>;
export type RenderTypeQueryType = Static<typeof RenderType>;
export type PresetQueryType = Static<typeof PresetQuery>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type PresetQueryKeys = KeysOfUnion<PresetQueryType>;

export function getSchema(): any {
  console.log(Type.Strict(SearchQuery));
  return { ...Type.Strict(SearchQuery), additionalProperties: false };
}
