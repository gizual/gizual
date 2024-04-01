import { Dependencies, ViewModel } from "@app/services/view-model";
import { action, makeObservable, observable, runInAction } from "mobx";

class EditorViewModel extends ViewModel {
  id = "editor";

  @observable private _contentLoading = false;
  @observable private _fileContent?: string;
  @observable private _filePath?: string;
  @observable private _modalState: "open" | "closed" = "closed";

  constructor({ mainController }: Dependencies, ...args: any[]) {
    super({ mainController }, ...args);

    makeObservable(this, undefined);
  }

  @action.bound
  setFileContent(fileContent: string) {
    this._fileContent = fileContent;
  }

  @action.bound
  openModal() {
    this._modalState = "open";
  }

  @action.bound
  closeModal() {
    this._modalState = "closed";
  }

  @action.bound
  setModalState(isOpen: boolean) {
    this._modalState = isOpen ? "open" : "closed";
  }

  @action.bound
  loadFileContent(path: string) {
    this._contentLoading = true;
    this._filePath = path;
    this.openModal();
    this._mainController._maestro.getFileContent(path).then((fc) => {
      runInAction(() => {
        this.setFileContent(fc);
        this._contentLoading = false;
      });
    });
  }

  get fileContent() {
    return this._fileContent;
  }

  get modalState() {
    return this._modalState;
  }

  get contentLoading() {
    return this._contentLoading;
  }

  get title() {
    return this._filePath;
  }
}

export { EditorViewModel };
