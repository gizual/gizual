import { observable, runInAction } from "mobx";

import { SearchBarViewModel } from "../primitives/search-bar/search-bar.vm";
import { MainController } from "../controllers";

export class MainPageViewModel {
  _state = observable({
    repoPanelVisible: true,
    settingsPanelVisible: true,
  });

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

  toggleRepoPanel = () => {
    runInAction(() => {
      this._state.repoPanelVisible = !this._state.repoPanelVisible;
    });
  };

  toggleSettingsPanel = () => {
    runInAction(() => {
      this._state.settingsPanelVisible = !this._state.settingsPanelVisible;
    });
  };

  get isRepoPanelVisible() {
    return this._state.repoPanelVisible;
  }

  get isSettingsPanelVisible() {
    return this._state.settingsPanelVisible;
  }

  get searchBarVM() {
    return this._searchBarVM;
  }
}
