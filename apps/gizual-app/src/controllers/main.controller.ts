import { LocalQueryManager } from "@app/services/local-query";
import { ColoringMode } from "@app/types";
import { action, computed, makeObservable, observable } from "mobx";

import { BAND_COLOR_RANGE, getBandColorScale } from "@giz/color-manager";
import { FileTree, Repository } from "@giz/explorer-web";
import { Maestro } from "@giz/maestro";

import { RepoController } from "./repo.controller";
import { SettingsController } from "./settings.controller";
import { ViewModelController } from "./vm.controller";

export const PANELS = ["explore", "analyze", "settings"] as const;
export type Panel = (typeof PANELS)[number];

export class MainController {
  _maestro: Maestro;

  @observable _coloringMode: ColoringMode = "age";
  @observable _fileTreeRoot?: FileTree;
  @observable _selectedPanel: Panel = "explore";

  @observable _vmController = new ViewModelController(this);
  @observable _settingsController: SettingsController;
  @observable _repoController: RepoController;
  @observable _localQueryManager?: LocalQueryManager;

  @observable _activeRenderWorkers = new Set<string>();
  @observable _isBusy = false;
  @observable _repoName = "";

  @observable _scale = 1;
  @observable _repo: Repository;
  @observable _numFiles = 0;

  @observable private _pendingTransition = false;

  constructor(maestro: Maestro) {
    makeObservable(this, undefined, { autoBind: true });

    this._repo = new Repository();
    this._settingsController = new SettingsController();
    this._settingsController.loadSettings();
    this._repoController = new RepoController(this);
    this._maestro = maestro;

    this._settingsController.on(
      "visualSettings:changed",
      (s) => {
        this._maestro.setVisualizationSettings(s);
      },
      true,
    );
  }

  attachUnloadListener() {
    if (!import.meta.env.DEV) window.addEventListener("beforeunload", this.beforeUnloadHandler);
  }

  detachUnloadListener() {
    window.removeEventListener("beforeunload", this.beforeUnloadHandler);
  }

  beforeUnloadHandler(event: BeforeUnloadEvent) {
    event?.preventDefault();
    event.returnValue = true;
  }

  get repoController() {
    return this._repoController;
  }

  @computed
  get selectedFiles(): string[] {
    return this.repoController.selectedFilesKeys;
  }

  isFileSelected(f: string) {
    return this.repoController.selectedFiles.has(f);
  }

  getSelectedFileNodeInfo(key: string) {
    return this.repoController.selectedFiles.get(key);
  }

  @computed
  get fileTreeRoot(): FileTree | undefined {
    if (this._repo.state !== "ready") return undefined;

    return this._repo.fileTree.tree;
    //return this._fileTreeRoot;
  }

  getStyle(key: string) {
    const doc = document.documentElement;
    return getComputedStyle(doc).getPropertyValue(key);
  }

  @action.bound
  setFileTreeRoot(root: FileTree) {
    this._fileTreeRoot = root;
  }

  @action.bound
  setPanel(panel: Panel) {
    this._scale = 1;
    this._selectedPanel = panel;
  }

  get selectedPanel() {
    return this._selectedPanel;
  }

  @action.bound
  setRepoName(name: string) {
    this._repoName = name;
  }

  get repoName() {
    return this._repoName;
  }

  @action.bound
  setBranchByName(name: string) {
    this._repo.setBranch(name);
    //this._selectedBranch = name;
  }

  get selectedBranch() {
    return this._repo.selectedBranch;
    //return this._selectedBranch;
  }

  @computed
  get branches() {
    if (this._repo.state !== "ready" || this._repo.gitGraph.loading) return [];
    const branches = this._repo.gitGraph.value?.branches;
    if (!branches) return [];
    return branches;
  }

  @computed
  get branchNames() {
    return this.branches.map((b) => b.name);
  }

  get authors() {
    return this._repo.authors;
  }

  @computed
  get authorColorScale() {
    return getBandColorScale(
      this.authors.map((a) => a.id),
      BAND_COLOR_RANGE,
    );
  }

  getAuthorById(id: string) {
    return this._repo.getAuthor(id);
  }

  @action.bound
  setColoringMode(mode: ColoringMode) {
    this._coloringMode = mode;
  }

  get coloringMode() {
    return this._coloringMode;
  }

  @computed
  get isLoading() {
    return this._repo.state === "loading" || this._maestro.state === "loading";
  }

  @computed
  get progressText() {
    if (!this.isLoading) return "";
    return this._maestro.progressText;
  }

  /**
   * @deprecated
   */
  @action.bound
  async openRepository(name: string, port: MessagePort) {
    await this._repo.setup(port);
    this.setRepoName(name);
    this.attachUnloadListener();
  }

  get isPendingTransition() {
    return this._pendingTransition;
  }

  get vmController() {
    return this._vmController;
  }

  get isBusy() {
    return this.isLoading;
  }

  @action.bound
  setIsBusy(busy: boolean) {
    this._isBusy = busy;
  }

  @action.bound
  unregisterWorker(file: string) {
    this._activeRenderWorkers.delete(file);
  }
  registerWorker(file: string) {
    this._activeRenderWorkers.add(file);
  }

  @computed
  get activeRenderWorkers() {
    return [...this._activeRenderWorkers.keys()];
  }

  @action.bound
  closeRepository() {
    this.setRepoName("");
    this._repo = new Repository();
    this.detachUnloadListener();
    window.location.reload();
  }

  @action.bound
  setNumFiles(n: number) {
    this._numFiles = n;
  }

  get numFiles() {
    return this._numFiles;
  }

  get settingsController() {
    return this._settingsController;
  }

  get settings() {
    return this.settingsController.settings;
  }

  get visualizationSettings() {
    return this.settings.visualizationSettings;
  }

  get editorSettings() {
    return this.settings.editor;
  }

  get timelineSettings() {
    return this.settings.timelineSettings;
  }

  get devSettings() {
    return this.settings.devSettings;
  }

  @action.bound
  setLocalQueryManager(manager: LocalQueryManager) {
    this._localQueryManager = manager;
  }

  get localQueryManager() {
    return this._localQueryManager;
  }
}
