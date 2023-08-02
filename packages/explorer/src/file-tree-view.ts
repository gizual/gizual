import { action, makeAutoObservable } from "mobx";
import type { Repository } from "./repository";
import type { FileTree, FileTreeNode } from "./types";

export class FileTreeView {
  loading: boolean = false;
  error: string | undefined = undefined;

  tree: FileTree;

  constructor(private repo: Repository) {
    this.tree = {
      name: "",
      kind: "folder",
      children: [],
    };

    makeAutoObservable(this, {
      _onData: action.bound,
      _onEnd: action.bound,
    });
  }

  update() {
    if (!this.repo.backend) return;

    this.loading = true;
    this.error = undefined;
    this.tree = {
      name: "",
      children: [],
    };
    const branch = this.repo.selectedBranch;
    this.repo.backend.streamFileTree(branch, this._onData, this._onEnd, this._onErr);
  }

  _onData(data: FileTreeNode) {

    const path = data.path;
    const kind = data.kind;

    let current = this.tree;

    for (let i = 0; i < path.length - 1; i++) {
      const folder = path[i];
      const child = current.children?.find((c) => c.name === folder);
      if (child) {
        current = child;
      } else {
        const newChild: FileTree = {
          name: folder,
          kind: "folder",
          children: [],
        };
        if (!current.children) current.children = [];
        current.children.push(newChild);
        current = newChild;
      }
    }

    const file: FileTree = {
      name: path[path.length - 1],
      kind,
    };
    if (!current.children) current.children = [];
    const existingChild = current.children.find((c) => c.name === file.name);
    if (existingChild) {
      existingChild.kind = file.kind;
      existingChild.loading = file.loading;
      return;
    }
    current.children.push(file);

    current.children.sort((a, b) => {
      if (a.kind === "folder" && b.kind !== "folder") return -1;
      if (a.kind !== "folder" && b.kind === "folder") return 1;
      return a.name?.localeCompare(b.name) ?? 0;
    });
  }

  _onEnd() {
    this.loading = false;
  }

  _onErr(err: any) {
    this.loading = false;
    this.error = err;
  }
}
