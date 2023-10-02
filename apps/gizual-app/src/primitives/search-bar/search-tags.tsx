import { DateTimeInputAssist } from "./panels";

export const TAG_PREFIX = "-";

export const AvailableTagIds = ["file", "author", "start", "end"] as const;
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
    inputAssist: <p>Not yet implemented.</p>,
  },
  author: {
    id: "author",
    textHint: "Apply the search to a specific author.",
    inputAssist: <p>Not yet implemented.</p>,
  },
  start: {
    id: "start",
    textHint: "Start searching from a specific date.",
    inputAssist: <DateTimeInputAssist tagId={"start"} />,
  },
  end: {
    id: "end",
    textHint: "Stop searching at a specific commit.",
    inputAssist: <DateTimeInputAssist tagId={"end"} />,
  },
};
