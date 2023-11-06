import { ColoringMode, FileNodeInfos, VisualizationConfig } from "@app/types";
import { BAND_COLOR_RANGE, getBandColorScale, GizDate } from "@app/utils";
import { ArgsProps, NotificationInstance } from "antd/es/notification/interface";
import dayjs from "dayjs";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { Database } from "@giz/database";
import { FileTree, Repository } from "@giz/explorer-web";
import { FileRendererPool } from "@giz/file-renderer";

import { RepoController } from "./repo.controller";
import { SettingsController } from "./settings.controller";
import { ViewModelController } from "./vm.controller";

type Panel = "explore" | "analyze" | "settings";
type Page = "welcome" | "main";

export class MainController {
  @observable _favoriteFiles: Map<string, FileNodeInfos | undefined> = new Map();
  @observable _notification?: NotificationInstance;

  @observable _coloringMode: ColoringMode = "age";
  @observable _fileTreeRoot?: FileTree;
  @observable _page: Page = "welcome";
  @observable _selectedPanel: Panel = "explore";

  @observable _vmController = new ViewModelController(this);
  @observable _settingsController: SettingsController;
  @observable _repoController: RepoController;
  @observable _fileRendererPool: FileRendererPool;
  @observable _database: Database;
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
    this._fileRendererPool = new FileRendererPool();
    this._database = new Database();
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

  get backendMetrics() {
    if (this._repo.state !== "ready")
      return { numBusyWorkers: 0, numWorkers: 0, numJobsInQueue: 0 };

    return this._repo.getMetrics();
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

  showFilePicker(type: "directory" | "zip" = "directory") {
    const input = document.createElement("input");
    input.style.display = "none";
    input.style.visibility = "hidden";
    input.type = "file";
    if (type === "directory") {
      //input.multiple = true;
      input.webkitdirectory = true;
    } else {
      input.accept = ".zip";
    }

    document.body.append(input);

    const remove = () => {
      try {
        input.remove();
      } catch {
        // noop
      }
    };

    const promise = new Promise<FileList>((resolve, reject) => {
      input.onchange = async () => {
        if (input.files && input.files.length > 0) {
          resolve(input.files);
        } else {
          reject("No files selected");
        }

        remove();
      };

      input.oncancel = () => {
        reject("User cancelled");
        remove();
      };
    });
    input.click();
    return promise;
  }

  @action.bound
  async openRepositoryLegacy(
    source: "directory" | "zip" | DataTransferItemList | FileList = "directory",
  ) {
    if (typeof source === "string") {
      source = await this.showFilePicker(source);
    }

    if (source.length === 0) return;

    this.setRepoName("?");
    await this._repo.setup(source);
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

    if (page === "main") {
      setTimeout(async () => {
        const port = await this._repoController.repo.controller?.createPort();

        this._database.init(port!);
      });
    }
  }

  async selectMatchingFiles(path: string, editedBy: string) {
    this.repoController.unloadAllFiles();

    const files = await this._database.selectMatchingFiles(
      path,
      editedBy,
      this.repoController.selectedBranch,
    );

    for (const file of files) {
      this.repoController.toggleFile(file, {
        path: file,
        title: file,
        // eslint-disable-next-line unicorn/no-null
        fileIconColor: [null, null],
      });
    }
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
