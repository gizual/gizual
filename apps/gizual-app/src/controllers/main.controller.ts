import { makeAutoObservable } from "mobx";

import { ExplorerLibgit2 } from "@giz/explorer-libgit2";
import { FileTreeNode } from "@app/types";
import { LocalStorage } from "@app/utils";
import { Repository } from "@giz/explorer";

type Panel = "explore" | "analyze";

export class MainController {
  _selectedFiles: Set<string> = new Set<string>();
  _favouriteFiles: Set<string> = new Set<string>();
  _selectedBranch = "main";

  _coloringMode: "By Age" | "By Author" = "By Age";
  _lineLengthScaling: "Local" | "Global" = "Local";
  _fileTreeRoot?: FileTreeNode;
  _page: "welcome" | "main" = "welcome";
  _libgit2!: ExplorerLibgit2;
  _selectedPanel: Panel = "explore";
  _isRepoPanelVisible = true;
  _isSettingsPanelVisible = true;
  _repo: Repository;

  constructor() {
    this._isRepoPanelVisible = LocalStorage.getBoolean("isRepoPanelVisible") ?? true;
    this._isSettingsPanelVisible = LocalStorage.getBoolean("isSettingsPanelVisible") ?? true;
    this._repo = new Repository();
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
    if (this._repo.state !== "ready" || this._repo.fileTree.loading) return undefined;

    return this._repo.fileTree.value;
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

  setColoringMode(mode: "By Age" | "By Author") {
    this._coloringMode = mode;
  }

  get coloringMode() {
    return this._coloringMode;
  }

  setLineLengthScaling(mode: "Local" | "Global") {
    this._lineLengthScaling = mode;
  }

  get lineLengthScaling() {
    return this._lineLengthScaling;
  }

  async openRepository() {
    const handle = await window.showDirectoryPicker();
    await this._repo.setup(handle);

    this.setPage("main");

    //const libgit2 = await ExplorerLibgit2.create(handle);
    //this._libgit2 = libgit2;
    //const branches = await libgit2.getBranches();

    //runInAction(() => {
    //  this._branches = branches;
    //  this._selectedBranch = branches[0];
    //});

    //autorun(() => {
    //  this.refreshFileTree();
    //});
    //this.setPage("main");
  }

  async refreshFileTree() {
    this._libgit2.getFileTree(this.selectedBranch).then((tree) => {
      this.setFileTreeRoot(tree);
    });
  }

  get page() {
    return this._page;
  }

  setPage(page: "welcome" | "main") {
    this._page = page;
  }
}
