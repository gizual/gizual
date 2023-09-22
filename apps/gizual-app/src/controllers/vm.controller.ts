import type { MainPageViewModel } from "@app/pages";
import type { CanvasViewModel } from "@app/primitives/canvas";
import type { FileTreeViewModel } from "@app/primitives/file-tree";
import { SearchBarViewModel } from "@app/primitives/search-bar/search-bar.vm";
import { TimelineViewModel } from "@app/primitives/timeline/timeline.vm";
import { LocalStorage } from "@app/utils";
import { makeAutoObservable } from "mobx";

export class ViewModelController {
  _canvasViewModel?: CanvasViewModel;
  _fileTreeViewModel?: FileTreeViewModel;
  _mainPageViewModel?: MainPageViewModel;
  _searchBarViewModel?: SearchBarViewModel;
  _timelineViewModel?: TimelineViewModel;

  _isRepoPanelVisible = true;
  _isSettingsPanelVisible = true;

  constructor() {
    this._isRepoPanelVisible = !LocalStorage.getBoolean("hideRepoPanel") ?? true;
    this._isSettingsPanelVisible = !LocalStorage.getBoolean("hideSettingsPanel") ?? true;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setTimelineViewModel(vm: TimelineViewModel) {
    this._timelineViewModel = vm;
  }

  get timelineViewModel(): TimelineViewModel | undefined {
    return this._timelineViewModel;
  }

  setSearchBarViewModel(vm: SearchBarViewModel) {
    this._searchBarViewModel = vm;
  }

  get searchBarViewModel(): SearchBarViewModel | undefined {
    return this._searchBarViewModel;
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
