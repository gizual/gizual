import { makeAutoObservable } from "mobx";

import { FileTreeNode } from "../primitives/file-tree/file-tree.vm";

export class MainController {
  _selectedFiles: Set<string> = new Set<string>();
  _favouriteFiles: Set<string> = new Set<string>();
  _selectedBranch = "main";
  _fileTreeRoot?: FileTreeNode;

  constructor() {
    makeAutoObservable(this);
  }

  toggleFile(name: string) {
    if (this._selectedFiles.has(name)) {
      this._selectedFiles.delete(name);
    } else this._selectedFiles.add(name);
  }

  get selectedFiles(): string[] {
    return [...this._selectedFiles.values()];
  }

  get fileTreeRoot(): FileTreeNode | undefined {
    return this._fileTreeRoot;
  }

  setFileTreeRoot(root: FileTreeNode) {
    this._fileTreeRoot = root;
  }

  toggleFavourite(name: string) {
    if (this._favouriteFiles.has(name)) {
      this._favouriteFiles.delete(name);
    } else this._favouriteFiles.add(name);
  }

  get favouriteFiles(): string[] {
    return [...this._favouriteFiles.values()];
  }

  setBranchByName(name: string) {
    this._selectedBranch = name;
  }

  get selectedBranch() {
    return this._selectedBranch;
  }
}
