import { action, makeObservable, observable, runInAction } from "mobx";

import { BlameView } from "./blame-view";
import { ExplorerPool } from "./explorer-pool";
import { PromiseObserver } from "./promise-observer";
import { FileTree } from "./types";

type Oid = string;
type Aid = string;
interface GitGraph {
  commit_indices: Map<Oid, number>;
  commits: CommitInfo[];
  branches: BranchInfo[];
  authors_indices: Map<Aid, number>;
  authors: AuthorInfo[];
}

interface AuthorInfo {
  id: Aid; // hash(concat(name, email))
  name: string;
  email: string;
}

interface BranchInfo {
  id: Oid;
  name: string;
  last_commit_id: Oid;

  //source_branch?: number;
  //source_commit?: number;
  //target_branch?: number;
}

interface CommitInfo {
  oid: Oid;
  aid: string;
  timestamp: string;
  message: string; // max 1 line bzw max 120 chars
  parents: [Oid | null, Oid | null];
  children: Oid[];

  is_merge: boolean;
}

export class Repository {
  backend?: ExplorerPool;

  _state: "uninitialized" | "loading" | "ready" | "error" = "uninitialized";

  _selectedBranch!: string;
  _selectedStartCommit!: string;
  _selectedEndCommit!: string;

  _gitGraph?: PromiseObserver<GitGraph>;
  _fileTree?: PromiseObserver<FileTree>;
  _blames: BlameView[] = [];

  constructor(branch?: string, startCommit?: string, endCommit?: string) {
    if (branch) this._selectedBranch = branch;
    if (startCommit) this._selectedStartCommit = startCommit;
    if (endCommit) this._selectedEndCommit = endCommit;

    makeObservable(this, {
      _state: observable,
      _selectedBranch: observable,
      _selectedStartCommit: observable,
      _selectedEndCommit: observable,
      _gitGraph: observable,
      _setState: action,
    });
  }

  _setState(state: "uninitialized" | "loading" | "ready" | "error") {
    this._state = state;
  }

  async setup(handle: FileSystemDirectoryHandle) {
    if (this.backend) {
      throw new Error("Already setup");
    }

    this._setState("loading");

    let backend: ExplorerPool;
    try {
      backend = await ExplorerPool.create(handle);
    } catch (error) {
      this._setState("error");
      throw error;
    }

    const branches = await backend.getBranches();

    const defaultBranch =
      branches.find((branch) => branch === "master" || branch === "main" || branch === "develop") ||
      branches[0];

    if (!defaultBranch) {
      this._setState("error");
      throw new Error("No default branch found");
    }

    const { startCommitId, endCommitId } = await backend.execute("get_commits_for_branch", [
      defaultBranch,
    ]);

    this._gitGraph = new PromiseObserver<GitGraph>({
      name: `GitGraph`,
      initialPromise: {
        create: async () => {
          const data = await backend.execute("git_graph");
          return data.graph;
        },
        args: [],
      },
    });

    this._fileTree = new PromiseObserver<FileTree>({
      name: `FileTree`,
      initialPromise: {
        create: (b) => backend.getFileTree(b),
        args: [defaultBranch],
      },
    });

    runInAction(() => {
      this.backend = backend;
      this._selectedBranch = defaultBranch;
      this._selectedStartCommit = startCommitId;
      this._selectedEndCommit = endCommitId;
      this._setState("ready");
    });
  }

  get selectedBranch() {
    return this._selectedBranch;
  }

  get selectedStartCommit() {
    return this._selectedStartCommit;
  }

  get selectedEndCommit() {
    return this._selectedEndCommit;
  }

  get state() {
    return this._state;
  }

  setBranch(branch: string) {
    this._selectedBranch = branch;
    this._updateFileTree();
    this._updateBlames();
  }

  setCommitRange(start: string, end: string) {
    this._selectedStartCommit = start;
    this._selectedEndCommit = end;
  }

  async _updateFileTree() {
    if (!this.backend) {
      throw new Error("Backend not initialized");
    }

    this._fileTree?.update((b) => this.backend!.getFileTree(b), this._selectedBranch);
  }

  get gitGraph() {
    if (!this._gitGraph) {
      throw new Error("gitGraph not initialized");
    }
    return this._gitGraph;
  }

  get fileTree() {
    if (!this._fileTree) {
      throw new Error("fileTree not initialized");
    }
    return this._fileTree;
  }

  getBlame(path: string) {
    if (!this.backend) {
      throw new Error("Backend not initialized");
    }

    const blame = new BlameView(this, path);
    this._blames.push(blame);
    return blame;
  }

  _removeBlame(blame: BlameView) {
    const index = this._blames.indexOf(blame);
    if (index !== -1) {
      this._blames.splice(index, 1);
    }
  }

  _updateBlames() {
    for (const blame of this._blames) {
      blame._refresh();
    }
  }
}
