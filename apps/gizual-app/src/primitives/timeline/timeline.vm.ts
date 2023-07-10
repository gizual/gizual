import { makeAutoObservable } from "mobx";

import { MainController } from "../../controllers";

export class TimelineViewModel {
  private _mainController: MainController;

  constructor(mainController: MainController) {
    this._mainController = mainController;

    makeAutoObservable(this);
  }
}
