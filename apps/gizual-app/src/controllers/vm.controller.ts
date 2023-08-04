import type { CanvasViewModel } from "@app/primitives/canvas";
import type { FileTreeViewModel } from "@app/primitives/file-tree";
import type { MainPageViewModel } from "@app/pages";

import { LocalStorage } from "@app/utils";
import { makeAutoObservable } from "mobx";

export class ViewModelController {
  _canvasViewModel?: CanvasViewModel;
  _fileTreeViewModel?: FileTreeViewModel;
  _mainPageViewModel?: MainPageViewModel;

  _isRepoPanelVisible = true;
  _isSettingsPanelVisible = true;

  constructor() {
    this._isRepoPanelVisible = !LocalStorage.getBoolean("hideRepoPanel") ?? true;
    this._isSettingsPanelVisible = !LocalStorage.getBoolean("hideSettingsPanel") ?? true;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setCanvasViewModel(vm: CanvasViewModel) {
    this._canvasViewModel = vm;
  }

  get canvasViewModel(): CanvasViewModel | undefined {
    return this._canvasViewModel;
  }

  setFileTreeViewModel(vm: FileTreeViewModel) {
    this._fileTreeViewModel = vm;
  }

  get fileTreeViewModel(): FileTreeViewModel | undefined {
    return this._fileTreeViewModel;
  }

  setMainPaveViewModel(vm: MainPageViewModel) {
    this._mainPageViewModel = vm;
  }

  get mainPageViewModel(): MainPageViewModel | undefined {
    return this._mainPageViewModel;
  }

  setRepoPanelVisibility(visible: boolean) {
    this._isRepoPanelVisible = visible;
    LocalStorage.setItem("hideRepoPanel", (!this._isRepoPanelVisible).toString());
  }

  get isRepoPanelVisible() {
    return this._isRepoPanelVisible;
  }

  toggleRepoPanelVisibility() {
    this.setRepoPanelVisibility(!this._isRepoPanelVisible);
  }

  setSettingsPanelVisibility(visible: boolean) {
    this._isSettingsPanelVisible = visible;
    LocalStorage.setItem("hideSettingsPanel", (!this._isSettingsPanelVisible).toString());
  }

  get isSettingsPanelVisible() {
    return this._isSettingsPanelVisible;
  }

  toggleSettingsPanelVisibility() {
    this.setSettingsPanelVisibility(!this._isSettingsPanelVisible);
  }
}
