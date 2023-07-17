import { makeAutoObservable } from "mobx";

import { MainController } from "../../controllers";

import { FileTreeNode } from "@app/types";

export class FileTreeViewModel {
  _root: FileTreeNode;
  _mainController: MainController;

  constructor(root: FileTreeNode | undefined, mainController: MainController) {
    this._mainController = mainController;
    this._root = root ?? { name: "", children: [] };

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
