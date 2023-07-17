export interface Blame {
  fileName: string;
  commits: Record<string, CommitInfo>;
  lines: BlameLine[];
}
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

export interface BlameLine {
  lineNo: number;
  commitId: string;
  content: string;
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

export interface CommitInfo {
  commitId: string;
  authorName: string;
  authorEmail: string;
  timestamp: string;
}

export function isCommitInfo(obj: any): obj is CommitInfo {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "commitId" in obj &&
    typeof obj.commitId === "string" &&
    "authorName" in obj &&
    typeof obj.authorName === "string" &&
    "authorEmail" in obj &&
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

export interface FileTree {
  name: string;
  children?: FileTree[];
  mime_type?: string;
}

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
