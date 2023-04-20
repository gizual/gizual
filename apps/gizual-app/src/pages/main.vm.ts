import { observable, runInAction } from "mobx";

import { SearchBarViewModel } from "../primitives/search-bar/search-bar.vm";

export class MainPageViewModel {
  _state = observable({
    repoPanelVisible: true,
    settingsPanelVisible: true,
  });

  private _searchBarVM: SearchBarViewModel;

  constructor() {
    this._searchBarVM = new SearchBarViewModel(this.toggleRepoPanel, this.toggleSettingsPanel);
  }

  toggleRepoPanel = () => {
    runInAction(() => {
      console.log("toggleRepoPanel");
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
