import _ from "lodash";
import { autorun, makeAutoObservable } from "mobx";

import { MainController } from "../../controllers";
import { FileViewModel } from "../file/file.vm";

export class CanvasViewModel {
  _mainController: MainController;
  _selectedFileVms: Record<string, FileViewModel> = {};

  constructor(mainController: MainController) {
    this._mainController = mainController;
    makeAutoObservable(this);

    autorun(() => {
      this.loadSelectedFiles();
    });
  }

  loadSelectedFiles() {
    const selectedFiles = this._mainController.selectedFiles;
    const existingFiles = Object.keys(this._selectedFileVms);

    const filesToLoad = _.difference(selectedFiles, existingFiles);
    const filesToUnload = _.difference(existingFiles, selectedFiles);

    for (const file of filesToLoad) {
      this._selectedFileVms[file] = new FileViewModel(this._mainController, file, {}, false, false);
    }

    for (const file of filesToUnload) {
      delete this._selectedFileVms[file];
    }
  }

  get selectedFiles(): FileViewModel[] {
    return Object.values(this._selectedFileVms);
  }
}
