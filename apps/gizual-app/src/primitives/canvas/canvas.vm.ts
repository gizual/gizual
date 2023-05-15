import _ from "lodash";
import { makeAutoObservable } from "mobx";

import { MainController } from "../../controllers";
import { FileViewModel } from "../file/file.vm";
import { MockFile } from "../file/mock";

export class CanvasViewModel {
  _mainController: MainController;
  constructor(mainController: MainController) {
    this._mainController = mainController;
    makeAutoObservable(this);
  }

  get selectedFiles(): FileViewModel[] {
    const vms: FileViewModel[] = [];
    for (const fileName of this._mainController._selectedFiles) {
      const mockFile = _.cloneDeep(MockFile);
      mockFile.fileName = fileName;
      vms.push(new FileViewModel(mockFile, this._mainController, {}, false, false));
    }
    return vms;
  }
}
