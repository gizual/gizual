import { MainController } from "../controllers";

export class MainPageViewModel {
  private _mainController: MainController;

  constructor(mainController: MainController) {
    this._mainController = mainController;
  }
}
