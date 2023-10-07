import type { CanvasViewModel } from "@app/primitives/canvas";
import type { FileTreeViewModel } from "@app/primitives/file-tree";
import { SearchBarViewModel } from "@app/primitives/search-bar/search-bar.vm";
import { TimelineViewModel } from "@app/primitives/timeline/timeline.vm";
import { LocalStorage } from "@app/utils";
import { makeAutoObservable, runInAction } from "mobx";

import type { MainController } from "./main.controller";

export class ViewModelController {
  _canvasViewModel?: CanvasViewModel;
  _fileTreeViewModel?: FileTreeViewModel;
  _searchBarViewModel?: SearchBarViewModel;
  _timelineViewModel?: TimelineViewModel;

  _mainController: MainController;

  _isRepoPanelVisible = true;
  _isAuthorPanelVisible = true;

  constructor(mainController: MainController) {
    this._isRepoPanelVisible = !LocalStorage.getBoolean("hideRepoPanel") ?? true;
    this._isAuthorPanelVisible = !LocalStorage.getBoolean("hideAuthorPanel") ?? true;
    this._mainController = mainController;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setTimelineViewModel(vm: TimelineViewModel) {
    this._timelineViewModel = vm;
  }

  get timelineViewModel(): TimelineViewModel | undefined {
    if (!this._timelineViewModel) {
      runInAction(() => {
        this._timelineViewModel = new TimelineViewModel(this._mainController);
      });
    }
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

  setAuthorPanelVisibility(visible: boolean) {
    this._isAuthorPanelVisible = visible;
    LocalStorage.setItem("hideAuthorPanel", (!this._isAuthorPanelVisible).toString());
  }

  get isAuthorPanelVisible() {
    return this._isAuthorPanelVisible;
  }

  toggleAuthorPanelVisibility() {
    this.setAuthorPanelVisibility(!this._isAuthorPanelVisible);
  }
}
