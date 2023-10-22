import { DateTimeInputAssist } from "./panels";
import { FileInputAssist } from "./panels/file";

export const TAG_PREFIX = "-";

export const AvailableTagIds = ["file", "author", "range"] as const;
export type AvailableTagId = (typeof AvailableTagIds)[number];
export const AvailableTagIdsForRegexp = AvailableTagIds.join("|");

export type Tag = {
  id: AvailableTagId;
  textHint: string;
  inputAssist?: React.ReactElement;
};

export type SelectedTag = {
  tag: Tag;
  value: string;
};

export const AvailableTags: Record<AvailableTagId, Tag> = {
  file: {
    id: "file",
    textHint: "Apply the search to a specific file.",
    inputAssist: <FileInputAssist tagId="file" />,
  },
  author: {
    id: "author",
    textHint: "Apply the search to a specific author.",
    inputAssist: <p>Not yet implemented.</p>,
  },
  range: {
    id: "range",
    textHint: "Constrain the visualization to a specific time-range.",
    inputAssist: <DateTimeInputAssist tagId="range" />,
  },
};
