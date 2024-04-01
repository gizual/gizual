import { CommitInfo } from "@giz/explorer";

export type Line = {
  content: string;
  commit?: CommitInfo;
  color?: string;
};
