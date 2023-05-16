import { makeAutoObservable } from "mobx";

import { FileTreeNode } from "../primitives/file-tree/file-tree.vm";

export class MainController {
  _selectedFiles: Set<string> = new Set<string>();
  _favouriteFiles: Set<string> = new Set<string>();
  _selectedBranch = "main";
  _coloringMode: "By Age" | "By Author" = "By Age";
  _lineLengthScaling: "Local" | "Global" = "Local";

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

  setColoringMode(mode: "By Age" | "By Author") {
    this._coloringMode = mode;
  }

  get coloringMode() {
    return this._coloringMode;
  }

  setLineLengthScaling(mode: "Local" | "Global") {
    this._lineLengthScaling = mode;
  }

  get lineLengthScaling() {
    return this._lineLengthScaling;
  }
}
