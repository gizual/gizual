import { TimelineViewModel } from "@app/primitives/timeline/timeline.vm";
import { action, computed, makeObservable, observable } from "mobx";

import type { MainController } from "./main.controller";

/**
 * This controller holds a reference to all ViewModels that *could* be
 * useful to control from within the main thread outside the scope of
 * the ViewModel itself. ViewModels that are created with `useViewModel`
 * can be attached to this controller automatically.
 *
 * @see `@app/services/view-model`
 */
export class ViewModelController {
  @observable _vms: Record<string, any> = {};

  _mainController: MainController;

  constructor(mainController: MainController) {
    this._mainController = mainController;
    makeObservable(this, undefined, { autoBind: true });
  }

  @action.bound
  attach(key: string, vm: any) {
    this._vms[key] = vm;
  }

  @action.bound
  detach(key: string) {
    delete this._vms[key];
  }

  getViewModel<T>(key: string): T | undefined {
    const vm = this._vms[key];
    if (vm === undefined) return undefined;

    return vm as T;
  }

  /**
   * @deprecated Use `getViewModel` instead.
   * @see this.getViewModel
   */
  @computed
  get timelineViewModel(): TimelineViewModel | undefined {
    if (this._vms["timeline"] === undefined) console.warn("Timeline ViewModel not found");
    return this._vms["timeline"];
  }
}
