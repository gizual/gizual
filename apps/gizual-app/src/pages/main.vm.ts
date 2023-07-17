import { SearchBarViewModel } from "../primitives/search-bar/search-bar.vm";
import { MainController } from "../controllers";

export class MainPageViewModel {
  private _searchBarVM: SearchBarViewModel;
  private _mainController: MainController;

  constructor(mainController: MainController) {
    this._mainController = mainController;
    this._searchBarVM = new SearchBarViewModel(
      this.toggleRepoPanel,
      this.toggleSettingsPanel,
      mainController
    );
  }

  toggleRepoPanel() {
    this._mainController.setRepoPanelVisibility(!this._mainController.isRepoPanelVisible);
  }

  toggleSettingsPanel() {
    this._mainController.setSettingsPanelVisibility(!this._mainController.isSettingsPanelVisible);
  }

  get isRepoPanelVisible() {
    return this._mainController.isRepoPanelVisible;
  }

  get isSettingsPanelVisible() {
    return this._mainController.isSettingsPanelVisible;
  }

  get searchBarVM() {
    return this._searchBarVM;
  }
}
