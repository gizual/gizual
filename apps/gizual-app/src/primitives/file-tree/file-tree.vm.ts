import { action, computed, makeObservable, observable } from "mobx";

export type FileTreeNode = {
  name: string;
  isDirectory: boolean;
  children: FileTreeNode[];
};

export class FileTreeViewModel {
  _root: FileTreeNode;
  _selectedFiles: Set<string>;

  constructor(root: FileTreeNode) {
    this._root = root;
    this._selectedFiles = new Set<string>();

    makeObservable(this, {
      _root: observable,
      _selectedFiles: observable,
      toggleFile: action,
      selectedFiles: computed,
    });
  }

  toggleFile(name: string) {
    if (this._selectedFiles.has(name)) {
      this._selectedFiles.delete(name);
    } else this._selectedFiles.add(name);
  }

  get selectedFiles(): string[] {
    return [...this._selectedFiles.values()];
  }
}
