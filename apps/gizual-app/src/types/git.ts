export type Oid = string;
export type Aid = string;

export interface GitGraph {
  commit_indices: Map<Oid, number>;
  commits: CInfo[];
  branches: BranchInfo[];
  authors_indices: Map<Aid, number>;
  authors: AuthorInfo[];
}

export interface AuthorInfo {
  id: Aid; // hash(concat(name, email))
  name: string;
  email: string;
}

export interface BranchInfo {
  id: Oid;
  name: string;
  last_commit_id: Oid;
}

export interface CInfo {
  oid: Oid;
  aid: string;
  timestamp: string;
  message: string; // max 1 line bzw max 120 chars
  parents: [Oid | null, Oid | null];
  children: Oid[];

  is_merge: boolean;
}

export interface GetBlameParams {
  branch: string;
  start_commit: Oid;
  end_commit: Oid;
  path: string;
}

export type FileNodeInfos = {
  path: string;
  title: string;
  fileIcon?: string;
  fileIconColor: [string | null, string | null] | undefined;
};

export function isFileNodeInfo(o: any): o is FileNodeInfos {
  return (
    o !== undefined &&
    o.path &&
    typeof o.path === "string" &&
    o.title &&
    typeof o.title === "string"
  );
}
