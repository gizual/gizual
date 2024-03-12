import { MainController } from "@app/controllers/main.controller";
import { action, IReactionDisposer, makeObservable, observable } from "mobx";

type Dependencies = { [key: string]: any };

/**
 * Base class that all ViewModels should extend,
 * if they want to use the `useViewModel` hook.
 */
class ViewModel {
  id?: string;
  @observable protected _mainController: MainController;
  @observable protected _args: any[] = [];
  @observable protected _disposers: IReactionDisposer[] = [];

  constructor({ mainController }: Dependencies, ...args: any[]) {
    this._mainController = mainController;
    this.init(...args);

    makeObservable(this, undefined, { autoBind: true });
  }

  @action.bound
  init(...args: any[]) {
    this._args = args;
  }

  @action.bound
  dispose() {
    for (const disposer of this._disposers) {
      disposer();
    }
  }
}

export { ViewModel };
export type { Dependencies };
