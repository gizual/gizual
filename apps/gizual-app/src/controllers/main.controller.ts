import { FileTreeNode } from "@app/types";
import { LocalStorage } from "@app/utils";
import { makeAutoObservable } from "mobx";

import { Repository } from "@giz/explorer";

type Panel = "explore" | "analyze";

export class MainController {
  _selectedFiles: Set<string> = new Set<string>();
  _favouriteFiles: Set<string> = new Set<string>();

  _coloringMode: "By Age" | "By Author" = "By Age";
  _lineLengthScaling: "Local" | "Global" = "Local";
  _fileTreeRoot?: FileTreeNode;
  _page: "welcome" | "main" = "welcome";
  _selectedPanel: Panel = "explore";
  _isRepoPanelVisible = true;
  _isSettingsPanelVisible = true;
  _repo: Repository;

  private _startDate: Date;
  private _endDate: Date;

  constructor() {
    this._isRepoPanelVisible = LocalStorage.getBoolean("isRepoPanelVisible") ?? true;
    this._isSettingsPanelVisible = LocalStorage.getBoolean("isSettingsPanelVisible") ?? true;
    this._repo = new Repository();

    this._startDate = new Date("2023-01-01");
    this._endDate = new Date("2023-08-01");
    makeAutoObservable(this, {}, { autoBind: true });
  }

  toggleFile(name: string) {
    if (this._selectedFiles.has(name)) {
      this._selectedFiles.delete(name);
    } else this._selectedFiles.add(name);
  }

  get selectedFiles(): string[] {
    return [...this._selectedFiles.values()];
  }

  get fileTreeRoot(): FileTreeNode | undefined {
    if (this._repo.state !== "ready") return undefined;

    return this._repo.fileTree.tree;
    //return this._fileTreeRoot;
  }

  setFileTreeRoot(root: FileTreeNode) {
    this._fileTreeRoot = root;
  }

  setPanel(panel: Panel) {
    this._selectedPanel = panel;
  }

  get selectedPanel() {
    return this._selectedPanel;
  }

  setRepoPanelVisibility(visible: boolean) {
    this._isRepoPanelVisible = visible;
    LocalStorage.setItem("isRepoPanelVisible", this._isRepoPanelVisible.toString());
  }

  get isRepoPanelVisible() {
    return this._isRepoPanelVisible;
  }

  setSettingsPanelVisibility(visible: boolean) {
    this._isSettingsPanelVisible = visible;
    LocalStorage.setItem("isSettingsPanelVisible", this._isSettingsPanelVisible.toString());
  }

  get isSettingsPanelVisible() {
    return this._isSettingsPanelVisible;
  }

  toggleFavourite(name: string) {
    if (this._favouriteFiles.has(name)) {
      this._favouriteFiles.delete(name);
    } else this._favouriteFiles.add(name);
  }

  get favouriteFiles(): string[] {
    return [...this._favouriteFiles.values()];
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
    if (this._repo.state !== "ready" || this._repo.gitGraph.loading) return [];
    const authors = this._repo.gitGraph.value?.authors;
    if (!authors) return [];
    return authors;
  }

  get authorsIndices() {
    if (this._repo.state !== "ready" || this._repo.gitGraph.loading) return [];
    const indices = this._repo.gitGraph.value?.authors_indices;
    if (!indices) return [];
    return indices;
  }

  setColoringMode(mode: "By Age" | "By Author") {
    this._coloringMode = mode;
  }

  //get coloringMode() {
  //  return this._coloringMode;
  //}

  setLineLengthScaling(mode: "Local" | "Global") {
    this._lineLengthScaling = mode;
  }

  //get lineLengthScaling() {
  //  return this._lineLengthScaling;
  //}

  get isLoading() {
    return this._repo.state === "loading";
  }

  async openRepository() {
    const handle = await window.showDirectoryPicker();
    await this._repo.setup(handle);

    this.setPage("main");
  }

  //async refreshFileTree() {
  //  this._libgit2.getFileTree(this.selectedBranch).then((tree) => {
  //    this.setFileTreeRoot(tree);
  //  });
  //}

  get page() {
    return this._page;
  }

  setPage(page: "welcome" | "main") {
    this._page = page;
  }

  setStartDate(date: Date) {
    this._startDate = date;
  }

  setEndDate(date: Date) {
    this._endDate = date;
  }

  get startDate() {
    return this._startDate;
  }

  get endDate() {
    return this._endDate;
  }
}
