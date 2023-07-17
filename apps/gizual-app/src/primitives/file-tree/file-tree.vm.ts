import { makeAutoObservable } from "mobx";

import { MainController } from "../../controllers";

import { FileTreeNode } from "@app/types";

export class FileTreeViewModel {
  _root: FileTreeNode;
  _mainController: MainController;

  constructor(root: FileTreeNode, mainController: MainController) {
    this._root = root;
    this._mainController = mainController;

    makeAutoObservable(this);
  }

  toggleFile(name: string) {
    this._mainController.toggleFile(name);
  }

  get selectedFiles(): string[] {
    return this._mainController.selectedFiles;
  }

  toggleFavourite(name: string) {
    this._mainController.toggleFavourite(name);
  }

  get favouriteFiles(): string[] {
    return this._mainController.favouriteFiles;
  }
}
