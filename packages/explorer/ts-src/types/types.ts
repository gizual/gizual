import type * as gen from "./generated";

export type Methods = keyof ParameterPayloadMap;

export type ParameterPayloadMap = {
  open_repository: gen.OpenRepositoryParams;
  stream_authors: gen.StreamAuthorsParams;
  get_file_tree: gen.GetFileTreeParams;
  get_branches: gen.NoParams;
  get_git_graph: gen.NoParams;
  get_blame: gen.BlameParams;
  get_file_content: gen.GetFileContentParams;
  get_commits_for_branch: gen.GetCommitsForBranchParams;
  stream_commits: gen.StreamCommitsParams;
  get_commits_for_time_range: gen.GetCommitsForTimeRangeParams;
  shutdown: gen.NoParams;
  get_initial_data: gen.NoParams;
  is_valid_rev: gen.IsValidRevParams;
  get_commit: gen.GetCommitParams;
};

export type Params<M extends Methods> = ParameterPayloadMap[M];

type IntermediateCallbackPayloadMap = {
  stream_authors: gen.Author;
  stream_file_tree: gen.FileTreeNode;
  stream_commits: gen.CommitInfo;
};

export type IntermediatePayload<M extends Methods> = M extends keyof IntermediateCallbackPayloadMap
  ? IntermediateCallbackPayloadMap[M]
  : never;

type FinalCallbackPayloadMap = {
  get_authors: gen.Author[];
  open_repository: gen.OpenRepositoryResult;
  stream_authors: void;
  stream_file_tree: void;
  stream_commits: void;
  get_file_tree: gen.FileTreeNode[];
  get_branches: string[];
  get_git_graph: gen.CommitTree;
  get_blame: gen.Blame;
  get_file_content: string;
  get_commits_for_branch: gen.Commit[];
  get_initial_data: gen.InitialDataResult;
  is_valid_rev: boolean;
  get_commit: gen.Commit;
  shutdown: void;
  get_commits_for_time_range: gen.CommitRange;
};

export type FinalPayload<M extends Methods> = M extends keyof FinalCallbackPayloadMap
  ? FinalCallbackPayloadMap[M]
  : never;

export type Response<M extends Methods> =
  | {
      error: Error;
    }
  | {
      error?: undefined;
      data: FinalPayload<M>;
      end: true;
    }
  | {
      error?: undefined;
      data: IntermediatePayload<M>;
      end?: false;
    };

export type Callback<M extends Methods> = (resp: Response<M>) => void;

export interface ExplorerI {
  send<M extends Methods>(method: M, params: Params<M>, cb: Callback<M>): void;
}

export interface ExplorerPoolMetrics {
  queuedJobs: number;
  busyWorkers: number;
  availableWorkers: number;
  totalWorkers: number;
}

export class JobCanceledError extends Error {
  constructor() {
    super("Job was canceled");
  }
}

export type ExplorerPoolI<Ref> = {
  getNumJobs(): Promise<number>;
  getNumWorkers(): Promise<number>;
  getNumBusyWorkers(): Promise<number>;
  setPoolSize(size: number): Promise<void>;

  request<M extends Methods>(method: M, params: Params<M>, cb: Callback<M>): Promise<Ref>;
  setPriority(ref: Ref, priority: number): void;
  cancel(ref: Ref): void;

  on(event: "metrics", cb: (metrics: ExplorerPoolMetrics) => void, opts?: { once?: boolean }): void;
  off(event: "metrics", cb: (metrics: ExplorerPoolMetrics) => void): void;
};
