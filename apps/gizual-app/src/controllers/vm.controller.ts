import type { CanvasViewModel } from "@app/primitives/canvas";
import type { FileTreeViewModel } from "@app/primitives/file-tree";
import { TimelineViewModel } from "@app/primitives/timeline/timeline.vm";
import { makeAutoObservable, runInAction } from "mobx";

import type { MainController } from "./main.controller";

export class ViewModelController {
  _canvasViewModel?: CanvasViewModel;
  _fileTreeViewModel?: FileTreeViewModel;
  _timelineViewModel?: TimelineViewModel;

  _mainController: MainController;

  _isAuthorPanelVisible = false;

  constructor(mainController: MainController) {
    this._isAuthorPanelVisible = false;
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

  setAuthorPanelVisibility(visible: boolean) {
    this._isAuthorPanelVisible = visible;
  }

  get isAuthorPanelVisible() {
    return this._isAuthorPanelVisible;
  }

  toggleAuthorPanelVisibility() {
    this.setAuthorPanelVisibility(!this._isAuthorPanelVisible);
  }
}
