import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { BlameView } from "./blame-view";
import { FileTreeView } from "./file-tree-view";
import { PoolPortal } from "./pool";
import { PromiseObserver } from "./promise-observer";
import { Aid, Author, GitGraph } from "./types";

export class Repository {
  portal?: PoolPortal;

  _state: "uninitialized" | "loading" | "ready" | "error" = "uninitialized";

  _selectedBranch!: string;
  _selectedStartCommit!: string;
  _selectedEndCommit!: string;

  _gitGraph?: PromiseObserver<GitGraph>;
  _fileTree: FileTreeView;
  _blames: BlameView[] = [];

  _authors: Map<Aid, Author>;

  constructor(branch?: string, startCommit?: string, endCommit?: string) {
    if (branch) this._selectedBranch = branch;
    if (startCommit) this._selectedStartCommit = startCommit;
    if (endCommit) this._selectedEndCommit = endCommit;
    this._authors = new Map();
    this._fileTree = new FileTreeView(this);

    makeObservable(this, {
      _state: observable,
      _selectedBranch: observable,
      _selectedStartCommit: observable,
      _selectedEndCommit: observable,
      _gitGraph: observable,
      _setState: action,
      authors: computed,
      _authors: observable,
    });
  }

  get authors() {
    return [...this._authors.values()];
  }

  getAuthor(aid: Aid): Author | undefined {
    return this._authors.get(aid);
  }

  _setState(state: "uninitialized" | "loading" | "ready" | "error") {
    this._state = state;
  }

  /**
   * @deprecated
   */
  async setup(port: MessagePort) {
    if (this.portal) {
      throw new Error("Already setup");
    }

    this._setState("loading");
    this.portal = new PoolPortal(port);

    const branches = await this.portal.getBranches();

    const defaultBranch =
      branches.find((branch) => branch === "master" || branch === "main" || branch === "develop") ||
      branches[0];

    if (!defaultBranch) {
      this._setState("error");
      throw new Error("No default branch found");
    }

    const { startCommitId, endCommitId } = await this.portal.execute<{
      startCommitId: string;
      endCommitId: string;
    }>("get_commits_for_branch", { branch: defaultBranch }).promise;

    this._gitGraph = new PromiseObserver<GitGraph>({
      name: `GitGraph`,
      initialPromise: {
        create: async () => {
          const data = await this.portal!.getGitGraph();
          return data.graph;
        },
        args: [],
      },
    });

    runInAction(() => {
      this._selectedBranch = defaultBranch;
      this._selectedStartCommit = startCommitId;
      this._selectedEndCommit = endCommitId;
      this._setState("ready");
    });

    this._fileTree.update();
    this._loadAuthors();
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
    this._fileTree.update();
    this._updateBlames();
  }

  setCommitRange(start: string, end: string) {
    this._selectedStartCommit = start;
    this._selectedEndCommit = end;
  }

  get gitGraph() {
    if (!this._gitGraph) {
      throw new Error("gitGraph not initialized");
    }
    return this._gitGraph;
  }

  get fileTree() {
    return this._fileTree;
  }

  getBlame(path: string) {
    if (!this.portal) {
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

  _loadAuthors() {
    this.portal!.streamAuthors(
      (author) => {
        runInAction(() => {
          this._authors.set(author.id, author);
        });
      },
      () => {},
      () => {
        console.error("Stream authors failed");
      },
    );
  }
}
