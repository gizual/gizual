import { makeAutoObservable } from "mobx";

export class DialogProviderViewModel {
  _isVisible = false;
  constructor() {
    makeAutoObservable(this);
  }

  get isVisible() {
    return this._isVisible;
  }

  open() {
    this._isVisible = true;
  }

  closePopover() {
    this._isVisible = false;
  }
}
