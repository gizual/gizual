import type { CanvasViewModel } from "@app/primitives/canvas/canvas.vm";
import type { EditorViewModel } from "@app/primitives/editor/editor.vm";
import type { TimelineViewModel } from "@app/primitives/timeline/timeline.vm";
import { action, computed, makeObservable, observable } from "mobx";

import { createLogger, Logger } from "@giz/logging";

import type { MainController } from "./main.controller";

type RefCountedVm = { vm: any; refCount: number };

/**
 * This controller holds a reference to all ViewModels that *could* be
 * useful to control from within the main thread outside the scope of
 * the ViewModel itself. ViewModels that are created with `useViewModel`
 * can be attached to this controller automatically.
 *
 * @see `@app/services/view-model`
 */
export class ViewModelController {
  @observable _vms: Record<string, RefCountedVm> = {};

  _mainController: MainController;

  logger: Logger = createLogger("VmController");

  constructor(mainController: MainController) {
    this._mainController = mainController;
    makeObservable(this, undefined, { autoBind: true });
  }

  @action.bound
  attach(key: string, vm: any) {
    const existingVm = this._vms[key];
    if (existingVm !== undefined && existingVm.refCount > 0) {
      existingVm.refCount++;
      existingVm.vm = vm;
      this.logger.debug(
        `ViewModel already exists, incrementing refCount: ${key}, ${existingVm.refCount} ref(s)`,
        vm,
      );
      return;
    }

    this.logger.debug(`Attaching ViewModel: ${key}`, vm);
    this._vms[key] = { vm, refCount: 1 };
  }

  @action.bound
  detach(key: string) {
    const existingVm = this._vms[key];
    if (existingVm === undefined) {
      this.logger.warn(`ViewModel not found: ${key}`);
      return;
    }
    if (existingVm.refCount > 1) {
      existingVm.refCount--;
      this.logger.debug(
        `ViewModel refCount > 1, decrementing: ${key}, ${existingVm.refCount} ref(s)`,
      );
      return;
    }

    this.logger.debug(`Detaching ViewModel: ${key}`);
    delete this._vms[key];
  }

  getViewModel<T>(key: string): T | undefined {
    const vm = this._vms[key];
    if (vm === undefined) return undefined;

    return vm as T;
  }

  @computed
  get editorViewModel(): EditorViewModel {
    if (this._vms["editor"] === undefined) this.logger.warn("Editor ViewModel not found");
    return this._vms["editor"].vm;
  }

  @computed
  get timelineViewModel(): TimelineViewModel | undefined {
    if (this._vms["timeline"] === undefined) this.logger.warn("Timeline ViewModel not found");
    return this._vms["timeline"].vm;
  }

  @computed
  get canvasViewModel(): CanvasViewModel | undefined {
    if (this._vms["canvas"] === undefined) this.logger.warn("Canvas ViewModel not found");
    return this._vms["canvas"].vm;
  }
}
