import { ColoringMode, FileNodeInfos, VisualizationConfig } from "@app/types";
import { BAND_COLOR_RANGE, getBandColorScale } from "@app/utils";
import { ArgsProps, NotificationInstance } from "antd/es/notification/interface";
import { action, computed, makeObservable, observable } from "mobx";

import { FileTree, Repository } from "@giz/explorer-web";
import { FileRendererPool } from "@giz/file-renderer";
import { Maestro } from "@giz/maestro";
import { GizDate } from "@giz/utils/gizdate";

import { RepoController } from "./repo.controller";
import { SettingsController } from "./settings.controller";
import { ViewModelController } from "./vm.controller";

export const PANELS = ["explore", "analyze", "settings"] as const;
type Panel = (typeof PANELS)[number];

export class MainController {
  @observable _favoriteFiles: Map<string, FileNodeInfos | undefined> = new Map();
  @observable _notification?: NotificationInstance;

  @observable _coloringMode: ColoringMode = "age";
  @observable _fileTreeRoot?: FileTree;
  @observable _selectedPanel: Panel = "explore";

  @observable _vmController = new ViewModelController(this);
  @observable _settingsController: SettingsController;
  @observable _repoController: RepoController;
  @observable _fileRendererPool: FileRendererPool;
  _maestro: Maestro;
  @observable _activeRenderWorkers = new Set<string>();
  @observable _isBusy = false;
  @observable _repoName = "";

  @observable _scale = 1;
  @observable _repo: Repository;
  @observable _numFiles = 0;

  @observable private _startDate: GizDate;
  @observable private _selectedStartDate: GizDate;
  @observable private _endDate: GizDate;
  @observable private _selectedEndDate: GizDate;

  @observable private _pendingTransition = false;

  constructor(maestro: Maestro) {
    makeObservable(this, undefined, { autoBind: true });

    this._repo = new Repository();
    this.setScale(1);
    this._settingsController = new SettingsController();
    this._settingsController.loadSettings();
    this._startDate = new GizDate("2023-01-01");
    this._endDate = new GizDate("2023-07-30");
    this._selectedStartDate = new GizDate("1970-01-01");
    this._selectedEndDate = new GizDate("1970-01-01");
    this._repoController = new RepoController(this);
    this._fileRendererPool = new FileRendererPool();
    this._maestro = maestro;
  }

  get repoController() {
    return this._repoController;
  }

  @action.bound
  attachNotificationInstance(notification: typeof this._notification) {
    this._notification = notification;
  }

  @action.bound
  displayNotification(args: ArgsProps) {
    if (this._notification === undefined) return;

    this._notification.open(args);
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
  toggleFavorite(name: string, info?: FileNodeInfos) {
    if (this._favoriteFiles.has(name)) {
      this._favoriteFiles.delete(name);
    } else this._favoriteFiles.set(name, info);
  }

  get favoriteFiles() {
    return this._favoriteFiles;
  }

  getFavoriteFileNodeInfo(key: string) {
    return this._favoriteFiles.get(key);
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

  /**
   * @deprecated
   */
  @action.bound
  async openRepository(name: string, port: MessagePort) {
    await this._repo.setup(port);
    this.setRepoName(name);
  }

  get isPendingTransition() {
    return this._pendingTransition;
  }

  @action.bound
  setStartDate(date: GizDate) {
    this._startDate = date;
  }

  @action.bound
  setSelectedStartDate(date: GizDate) {
    if (this._selectedStartDate.getTime() !== date.getTime()) {
      this._selectedStartDate = date;
    }
  }

  @action.bound
  setEndDate(date: GizDate) {
    this._endDate = date;
  }

  @action.bound
  setSelectedEndDate(date: GizDate) {
    if (this._selectedEndDate.getTime() !== date.getTime()) this._selectedEndDate = date;
  }

  get startDate() {
    return this._startDate;
  }

  @computed
  get selectedStartDate() {
    return this._selectedStartDate < this._selectedEndDate
      ? this._selectedStartDate
      : this._selectedEndDate;
  }

  get endDate() {
    return this._endDate;
  }

  @computed
  get selectedEndDate() {
    return this._selectedEndDate > this._selectedStartDate
      ? this._selectedEndDate
      : this._selectedStartDate;
  }

  @computed
  get visualizationConfig(): VisualizationConfig {
    return {
      colors: {
        newest: this.settingsController.settings.visualizationSettings.colors.new.value,
        oldest: this.settingsController.settings.visualizationSettings.colors.old.value,
        notLoaded: this.settingsController.settings.visualizationSettings.colors.notLoaded.value,
      },
      style: {
        lineLength: this.settingsController.settings.visualizationSettings.style.lineLength.value,
      },
    };
  }

  @action.bound
  setScale(scale: number) {
    const root = document.documentElement;
    root.style.setProperty("--canvas-scale", scale.toString());
    root.style.setProperty("--canvas-scale-reverse", (1 / scale).toString());
    this._scale = scale;
  }

  get scale() {
    return this._scale;
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

  get numRenderJobs() {
    return this._fileRendererPool.numJobsInQueue;
  }

  get numBusyRenderWorkers() {
    return this._fileRendererPool.numBusyWorkers;
  }

  get numRenderWorkers() {
    return this._fileRendererPool.numWorkers;
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
}
