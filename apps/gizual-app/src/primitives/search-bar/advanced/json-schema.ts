import { Static, Type } from "@sinclair/typebox";

const FilesQueryConditions = Type.Object({
  path: Type.Optional(Type.Array(Type.String())),
  lastEditedBy: Type.Optional(Type.Array(Type.String())),
  editedBy: Type.Optional(Type.Array(Type.String())),
  createdBy: Type.Optional(Type.Array(Type.String())),
  contains: Type.Optional(Type.String()),
});

const AndOrQuery = Type.Array(FilesQueryConditions, { minItems: 2 });

const FilesQuery = Type.Object({
  and: Type.Optional(AndOrQuery),
  or: Type.Optional(AndOrQuery),
  not: Type.Optional(FilesQueryConditions),
  ...FilesQueryConditions.properties,
});

const TimeSinceFirstCommitBy = Type.Object({
  sinceFirstCommitBy: Type.String(),
});

const TimeRangeByDate = Type.Object({
  rangeByDate: Type.Array(Type.String(), { minItems: 1, maxItems: 2 }),
});

const TimeRangeByRef = Type.Object({
  rangeByRef: Type.Array(Type.String(), { minItems: 1, maxItems: 2 }),
});

const TimeQuery = Type.Union([TimeSinceFirstCommitBy, TimeRangeByDate, TimeRangeByRef]);

const HighlightItem = Type.Object({
  fill: Type.Optional(Type.String()),
  if: Type.Optional(Type.String()),
  stroke: Type.Optional(Type.String()),
});

const HighlightsQuery = Type.Array(HighlightItem);

const SearchQuery = Type.Object({
  files: Type.Optional(FilesQuery),
  time: Type.Optional(TimeQuery),
  highlight: Type.Optional(HighlightsQuery),
});

export type SearchQueryType = Static<typeof SearchQuery>;

export function getSchema() {
  return { ...Type.Strict(SearchQuery), additionalProperties: false };
}

export const defaultQuery = `{
  "files": {
    "$or": [
      { "path": ["index.html", "index.js", "*.ts"] },
      { "lastEditedBy": ["joe"] },
      { "editedBy": ["joe"] },
      { "createdBy": ["joe"] },
      { "contains": "hello" }
    ]
  },
  "time": {
    "rangeByDate": ["2020-01-01", "2020-01-02"]
  },
  "highlight": [
    {
      "fill": "<%= gradient(data.age) %>"
    },
    {
      "if": "<%= data.author === 'joe' %>",
      "stroke": "green",
      "fill": "<%= data.commitDate > '2020-01-01' ? 'red' : 'blue' %>"
    }
  ]
}`;
