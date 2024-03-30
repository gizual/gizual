// This file has been generated by Specta. DO NOT EDIT.

export type Author = { id: string; name: string; email: string; gravatarHash: string; numCommits: number }

export type AuthorInfo = { id: string; name: string; email: string }

export type Blame = { fileName: string; commits: { [key in string]: CommitInfo }; lines: BlameLine[] }

export type BlameLine = { lineNo: number; commitId: string; content: string }

export type BlameParams = { rev: string; path: string; preview?: boolean | null; sinceRev?: string | null }

export type BranchInfo = { id: string; name: string; last_commit_id: string }

export type Commit = { oid: string; aid: string; message: string; files: CommitFiles; timestamp: string }

export type CommitFiles = { deleted: string[]; modified: string[]; added: string[]; renamed: ([string, string])[] }

export type CommitInfo = { commitId: string; authorId: string; timestamp: string }

export type CommitMeta = { oid: string; aid: string; message: string; timestamp: string }

export type CommitRange = { sinceCommit: Commit | null; untilCommit: Commit | null }

export type CommitTree = { graph: HistoryGraph; dot: string }

export type CommitsForBranch = { start_commit: string; end_commit: string }

export type FileTreeNode = { path: string[]; kind?: any | null; loading?: boolean | null }

export type GetCommitParams = { rev: string }

export type GetCommitsForBranchParams = { branch: string }

export type GetCommitsForTimeRangeParams = { branch: string; startSeconds: number; endSeconds: number }

export type GetFileContentParams = { path: string; rev: string }

export type GetFileTreeParams = { rev: string }

export type GitGraphCommitInfo = { oid: string; aid: string; timestamp: string; message: string; is_merge: boolean; parents: (string | null)[]; children: string[] }

export type HistoryGraph = { commit_indices: { [key in string]: number }; commits: GitGraphCommitInfo[]; branches: BranchInfo[] }

export type Infallible = never

export type InitialDataResult = { currentBranch: string; lastCommit: Commit; firstCommit: Commit; remotes: Remote[]; branches: string[]; tags: string[] }

export type IsValidRevParams = { rev: string }

export type NoParams = Record<string, never>

export type OpenRepositoryParams = { path: string }

export type OpenRepositoryResult = { success: boolean }

export type Remote = { name: string; url: string }

export type StreamAuthorsParams = Record<string, never>

export type StreamCommitsParams = Record<string, never>

