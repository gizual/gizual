import { ColoringMode, FileNodeInfos } from "@app/types";
import { BAND_COLOR_RANGE, getBandColorScale } from "@app/utils";
import { makeAutoObservable } from "mobx";

import { FileTree, Repository } from "@giz/explorer";

import { ViewModelController } from "./vm.controller";

type Panel = "explore" | "analyze";

export class MainController {
  _selectedFiles: Map<string, FileNodeInfos | {}> = new Map();
  _favouriteFiles: Map<string, FileNodeInfos | undefined> = new Map();

  _coloringMode: ColoringMode = "age";
  _fileTreeRoot?: FileTree;
  _page: "welcome" | "main" = "welcome";
  _selectedPanel: Panel = "explore";

  _vmController = new ViewModelController();
  _numActiveWorkers = 0;
  _isBusy = false;

  _scale = 1;
  _repo: Repository;

  private _startDate: Date;
  private _selectedStartDate: Date;
  private _endDate: Date;
  private _selectedEndDate: Date;

  constructor() {
    this._repo = new Repository();

    this._startDate = new Date("2023-01-01");
    this._selectedStartDate = new Date("2023-01-01");
    this._endDate = new Date("2023-07-30");
    this._selectedEndDate = new Date("2023-07-30");
    this.setScale(1);
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get backendMetrics() {
    if (this._repo.state !== "ready") return { numBusyWorkers: 0, numWorkers: 0 };

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
    this._selectedPanel = panel;
  }

  get selectedPanel() {
    return this._selectedPanel;
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

  get authorColorScale() {
    return getBandColorScale(
      this.authors.map((a) => a.id),
      BAND_COLOR_RANGE,
    );
  }

  getAuthorById(id: string) {
    return this._repo.getAuthor(id);
  }

  setColoringMode(mode: ColoringMode) {
    this._coloringMode = mode;
  }

  get coloringMode() {
    return this._coloringMode;
  }

  get isLoading() {
    return this._repo.state === "loading";
  }

  async openRepository() {
    const handle = await window.showDirectoryPicker();
    await this._repo.setup(handle);

    this.setPage("main");
  }

  get page() {
    return this._page;
  }

  setPage(page: "welcome" | "main") {
    this._page = page;
  }

  setStartDate(date: Date) {
    this._startDate = date;
  }

  setSelectedStartDate(date: Date) {
    if (this._selectedStartDate.getTime() !== date.getTime()) this._selectedStartDate = date;
  }

  setEndDate(date: Date) {
    this._endDate = date;
  }

  setSelectedEndDate(date: Date) {
    if (this._selectedEndDate.getTime() !== date.getTime()) this._selectedEndDate = date;
  }

  get startDate() {
    return this._startDate;
  }

  get selectedStartDate() {
    return this._selectedStartDate < this._selectedEndDate
      ? this._selectedStartDate
      : this._selectedEndDate;
  }

  get endDate() {
    return this._endDate;
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
}
