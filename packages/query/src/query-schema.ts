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
const HighlightItem = Type.Object({
  fill: Type.Optional(Type.String()),
  $if: Type.Optional(Type.String()),
  stroke: Type.Optional(Type.String()),
});

const HighlightsQuery = Type.Array(HighlightItem);

const ModeItem = Type.Object({
  type: Type.Union([Type.Literal("gradient-age"), Type.Literal("palette-author")]),
  values: Type.Optional(Type.Array(Type.String())),
});

export const SearchQuery = Type.Object({
  mode: ModeItem,
  time: Type.Optional(TimeQuery),
  files: Type.Optional(FilesQuery),
  highlight: Type.Optional(HighlightsQuery),
});

export type SearchQueryType = Static<typeof SearchQuery>;

export function getSchema(): any {
  return { ...Type.Strict(SearchQuery), additionalProperties: false };
}

export const defaultQuery = `{
  "files": {
    "changedInRef": "HEAD"
  },
  "time": {
    "rangeByDate": ["2022-11-01", "2023-11-01"]
  }, 
  "highlight": [
    {
      "fill": "<%= _.gradient(_.age) %>"
    }
  ]
}`;

export const demoQuery = `{
  "time": {
    "rangeByDate": ["2020-01-01", "2020-01-02"]
  },
  "files": {
    "$or": [
      { "path": ["index.html", "index.js", "*.ts"] },
      { "lastEditedBy": ["joe"] },
      { "editedBy": ["joe"] },
      { "createdBy": ["joe"] },
      { "contains": "hello" }
    ]
  },
  "highlight": [
    {
      "fill": "<%= _.gradient(_.age) %>"
    },
    {
      "if": "<%= _.author === 'joe' %>",
      "stroke": "green",
      "fill": "<%= _.commitDate > '2020-01-01' ? 'red' : 'blue' %>"
    }
  ]
}`;
