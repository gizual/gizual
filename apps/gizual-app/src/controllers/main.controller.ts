import { ColouringMode, FileNodeInfos, VisualisationConfig } from "@app/types";
import { BAND_COLOUR_RANGE, getBandColourScale, GizDate } from "@app/utils";
import { ArgsProps, NotificationInstance } from "antd/es/notification/interface";
import dayjs from "dayjs";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { FileTree, Repository } from "@giz/explorer";

import { RepoController } from "./repo.controller";
import { SettingsController } from "./settings.controller";
import { ViewModelController } from "./vm.controller";

type Panel = "explore" | "analyse" | "settings";
type Page = "welcome" | "main";

export class MainController {
  @observable _favouriteFiles: Map<string, FileNodeInfos | undefined> = new Map();
  @observable _notification?: NotificationInstance;

  @observable _colouringMode: ColouringMode = "age";
  @observable _fileTreeRoot?: FileTree;
  @observable _page: Page = "welcome";
  @observable _selectedPanel: Panel = "explore";

  @observable _vmController = new ViewModelController(this);
  @observable _settingsController: SettingsController;
  @observable _repoController: RepoController;
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

  constructor() {
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
  get backendMetrics() {
    if (this._repo.state !== "ready")
      return { numBusyWorkers: 0, numWorkers: 0, numJobsInQueue: 0 };

    return this._repo.metrics;
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
  toggleFavourite(name: string, info?: FileNodeInfos) {
    if (this._favouriteFiles.has(name)) {
      this._favouriteFiles.delete(name);
    } else this._favouriteFiles.set(name, info);
  }

  get favouriteFiles() {
    return this._favouriteFiles;
  }

  getFavouriteFileNodeInfo(key: string) {
    return this._favouriteFiles.get(key);
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
  get authorColourScale() {
    return getBandColourScale(
      this.authors.map((a) => a.id),
      BAND_COLOUR_RANGE,
    );
  }

  getAuthorById(id: string) {
    return this._repo.getAuthor(id);
  }

  @action.bound
  setColouringMode(mode: ColouringMode) {
    this._colouringMode = mode;
  }

  get colouringMode() {
    return this._colouringMode;
  }

  @computed
  get isLoading() {
    return this._repo.state === "loading";
  }

  @action.bound
  async openRepository() {
    const handle = await window.showDirectoryPicker();
    this.setRepoName(handle.name);
    await this._repo.setup(handle);
    runInAction(() => {
      this._pendingTransition = true;
    });
  }

  get page() {
    return this._page;
  }

  get isPendingTransition() {
    return this._pendingTransition;
  }

  @action.bound
  setPage(page: Page) {
    this._page = page;
    this._pendingTransition = false;
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

  @computed
  get startDate() {
    if (dayjs(this._startDate).isValid()) return this._startDate;

    return new GizDate();
  }

  @computed
  get selectedStartDate() {
    return this._selectedStartDate < this._selectedEndDate
      ? this._selectedStartDate
      : this._selectedEndDate;
  }

  @computed
  get endDate() {
    if (dayjs(this._endDate).isValid()) return this._endDate;

    return new GizDate();
  }

  @computed
  get selectedEndDate() {
    return this._selectedEndDate > this._selectedStartDate
      ? this._selectedEndDate
      : this._selectedStartDate;
  }

  @computed
  get visualisationConfig(): VisualisationConfig {
    return {
      colours: {
        newest: this.settingsController.settings.visualisationSettings.colours.new.value,
        oldest: this.settingsController.settings.visualisationSettings.colours.old.value,
        notLoaded: this.settingsController.settings.visualisationSettings.colours.notLoaded.value,
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

  get numActiveWorkers() {
    return this._activeRenderWorkers.size;
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
    this.setPage("welcome");
    this.setRepoName("");
    this._repo = new Repository();
  }

  @action.bound
  setNumFiles(n: number) {
    this._numFiles = n;
  }

  @action.bound
  triggerSearchBarUpdate(force = false) {
    this.vmController._searchBarViewModel?.triggerDateTimeUpdate(force);
  }

  get numFiles() {
    return this._numFiles;
  }

  get settingsController() {
    return this._settingsController;
  }
}
