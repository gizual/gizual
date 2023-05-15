import { makeAutoObservable } from "mobx";

export class EditorPopoverViewModel {
  _isVisible = false;
  constructor() {
    makeAutoObservable(this);
  }

  get isVisible() {
    return this._isVisible;
  }

  open() {
    const body = document.querySelector("#overlay");
    if (body) {
      body.classList.add("overlay");
    }
    this._isVisible = true;
  }

  closePopover() {
    const body = document.querySelector("#overlay");
    if (body) {
      body.classList.remove("overlay");
    }
    this._isVisible = false;
  }
}
