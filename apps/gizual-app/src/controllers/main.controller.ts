import { ColouringMode, FileNodeInfos } from "@app/types";
import { BAND_COLOUR_RANGE, getBandColourScale, GizDate } from "@app/utils";
import { ArgsProps, NotificationInstance } from "antd/es/notification/interface";
import dayjs from "dayjs";
import { makeAutoObservable } from "mobx";

import { FileTree, Repository } from "@giz/explorer";

import { SettingsController } from "./settings.controller";
import { ViewModelController } from "./vm.controller";

type Panel = "explore" | "analyse" | "settings";
type Page = "welcome" | "main";

export class MainController {
  _selectedFiles: Map<string, FileNodeInfos | {}> = new Map();
  _favouriteFiles: Map<string, FileNodeInfos | undefined> = new Map();
  _notification?: NotificationInstance;

  _colouringMode: ColouringMode = "age";
  _fileTreeRoot?: FileTree;
  _page: Page = "welcome";
  _selectedPanel: Panel = "explore";

  _vmController = new ViewModelController();
  _settingsController: SettingsController;
  _numActiveWorkers = 0;
  _isBusy = false;
  _repoName = "";

  _scale = 1;
  _repo: Repository;
  _numFiles = 0;

  private _startDate: GizDate;
  private _selectedStartDate: GizDate;
  private _endDate: GizDate;
  private _selectedEndDate: GizDate;

  private _pendingTransition = false;

  constructor() {
    this._repo = new Repository();

    this.setScale(1);
    this._settingsController = new SettingsController();
    this._settingsController.loadSettings();
    this._startDate = new GizDate("2023-01-01");
    this._endDate = new GizDate("2023-07-30");
    this._selectedStartDate = new GizDate("1970-01-01");
    this._selectedEndDate = new GizDate("1970-01-01");

    makeAutoObservable(this, {}, { autoBind: true });
  }

  attachNotificationInstance(notification: typeof this._notification) {
    this._notification = notification;
  }

  displayNotification(args: ArgsProps) {
    if (this._notification === undefined) return;

    this._notification.open(args);
  }

  get backendMetrics() {
    if (this._repo.state !== "ready")
      return { numBusyWorkers: 0, numWorkers: 0, numJobsInQueue: 0 };

    return this._repo.metrics;
  }

  toggleFile(name: string, info?: FileNodeInfos) {
    if (this._selectedFiles.has(name)) {
      this._selectedFiles.delete(name);
    } else this._selectedFiles.set(name, info ?? {});
  }

  get selectedFiles(): string[] {
    return [...this._selectedFiles.keys()];
  }

  isFileSelected(f: string) {
    return this._selectedFiles.has(f);
  }

  getSelectedFileNodeInfo(key: string) {
    return this._selectedFiles.get(key);
  }

  get fileTreeRoot(): FileTree | undefined {
    if (this._repo.state !== "ready") return undefined;

    return this._repo.fileTree.tree;
    //return this._fileTreeRoot;
  }

  setFileTreeRoot(root: FileTree) {
    this._fileTreeRoot = root;
  }

  setPanel(panel: Panel) {
    this._scale = 1;
    this._selectedPanel = panel;
  }

  get selectedPanel() {
    return this._selectedPanel;
  }

  setRepoName(name: string) {
    this._repoName = name;
  }

  get repoName() {
    return this._repoName;
  }

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

  setBranchByName(name: string) {
    this._repo.setBranch(name);
    //this._selectedBranch = name;
  }

  get selectedBranch() {
    return this._repo.selectedBranch;
    //return this._selectedBranch;
  }

  get branches() {
    if (this._repo.state !== "ready" || this._repo.gitGraph.loading) return [];
    const branches = this._repo.gitGraph.value?.branches;
    if (!branches) return [];
    return branches;
  }

  get branchNames() {
    return this.branches.map((b) => b.name);
  }

  get authors() {
    return this._repo.authors;
  }

  get authorColourScale() {
    return getBandColourScale(
      this.authors.map((a) => a.id),
      BAND_COLOUR_RANGE,
    );
  }

  getAuthorById(id: string) {
    return this._repo.getAuthor(id);
  }

  setColouringMode(mode: ColouringMode) {
    this._colouringMode = mode;
  }

  get colouringMode() {
    return this._colouringMode;
  }

  get isLoading() {
    return this._repo.state === "loading";
  }

  async openRepository() {
    const handle = await window.showDirectoryPicker();
    this.setRepoName(handle.name);
    await this._repo.setup(handle);
    this._pendingTransition = true;
  }

  get page() {
    return this._page;
  }

  get isPendingTransition() {
    return this._pendingTransition;
  }

  setPage(page: Page) {
    this._page = page;
    this._pendingTransition = false;
  }

  setStartDate(date: GizDate) {
    this._startDate = date;
  }

  setSelectedStartDate(date: GizDate) {
    if (this._selectedStartDate.getTime() !== date.getTime()) {
      this._selectedStartDate = date;
    }
  }

  setEndDate(date: GizDate) {
    this._endDate = date;
  }

  setSelectedEndDate(date: GizDate) {
    if (this._selectedEndDate.getTime() !== date.getTime()) this._selectedEndDate = date;
  }

  get startDate() {
    if (dayjs(this._startDate).isValid()) return this._startDate;

    return new GizDate();
  }

  get selectedStartDate() {
    return this._selectedStartDate < this._selectedEndDate
      ? this._selectedStartDate
      : this._selectedEndDate;
  }

  get endDate() {
    if (dayjs(this._endDate).isValid()) return this._endDate;

    return new GizDate();
  }

  get selectedEndDate() {
    return this._selectedEndDate > this._selectedStartDate
      ? this._selectedEndDate
      : this._selectedStartDate;
  }

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

  setIsBusy(busy: boolean) {
    this._isBusy = busy;
  }

  get numActiveWorkers() {
    return this._numActiveWorkers;
  }

  setNumActiveWorkers(n: number) {
    this._numActiveWorkers = n;
  }

  decrementNumActiveWorkers() {
    this._numActiveWorkers--;
    if (this.numActiveWorkers < 0) this._numActiveWorkers = 0;
  }

  incrementNumActiveWorkers() {
    this._numActiveWorkers++;
  }

  closeRepository() {
    this.setPage("welcome");
    this.setRepoName("");
    this._repo = new Repository();
  }

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
