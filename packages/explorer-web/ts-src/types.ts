import { Blame, BlameLine, CommitInfo } from "@giz/explorer";
export type { Blame, BlameLine, CommitInfo, GetFileContentResult } from "@giz/explorer";

export function isBlame(obj: any): obj is Blame {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "fileName" in obj &&
    typeof obj.fileName === "string" &&
    "commits" in obj &&
    typeof obj.commits === "object" &&
    Object.values(obj.commits).every((element) => isCommitInfo(element)) &&
    "lines" in obj &&
    Array.isArray(obj.lines) &&
    obj.lines.every((element: any) => isBlameLine(element))
  );
}

export function isBlameLine(obj: any): obj is BlameLine {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "lineNo" in obj &&
    typeof obj.lineNo === "number" &&
    "commitId" in obj &&
    typeof obj.commitId === "string" &&
    "content" in obj &&
    typeof obj.content === "string"
  );
}

export function isCommitInfo(obj: any): obj is CommitInfo {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "authorId" in obj &&
    typeof obj.authorId === "string" &&
    typeof obj.authorEmail === "string" &&
    "timestamp" in obj &&
    typeof obj.timestamp === "string"
  );
}

export interface FileContent {
  content: string;
  path: string;
}

export function isFileContent(obj: any): obj is FileContent {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "content" in obj &&
    typeof obj.content === "string" &&
    "path" in obj &&
    typeof obj.path === "string"
  );
}

export type FileTree = {
  name: string;
  kind?: number | "folder";
  loading?: boolean;
  children?: FileTree[];
};

export function isFileTree(obj: any): obj is FileTree {
  return (
    (typeof obj === "object" &&
      obj !== null &&
      "name" in obj &&
      typeof obj.name === "string" &&
      ("children" in obj ? Array.isArray(obj.children) : true) &&
      obj.children?.every(isFileTree)) ||
    true
  );
}

export type FileTreeNode = {
  path: string[];
  kind?: number | "folder";
  loading?: boolean;
};

export type Oid = string;
export type Aid = string;
export interface GitGraph {
  commit_indices: Map<Oid, number>;
  commits: CommitInfo[];
  branches: BranchInfo[];
}

export interface BranchInfo {
  id: Oid;
  name: string;
  last_commit_id: Oid;

  //source_branch?: number;
  //source_commit?: number;
  //target_branch?: number;
}

export interface GitGraphCommitInfo {
  oid: Oid;
  aid: string;
  timestamp: string;
  message: string; // max 1 line bzw max 120 chars
  parents: [Oid | null, Oid | null];
  children: Oid[];

  is_merge: boolean;
}

export interface Author {
  id: Aid; // hash(concat(name, email))
  name: string;
  email: string;
  gravatarHash: string;
}
