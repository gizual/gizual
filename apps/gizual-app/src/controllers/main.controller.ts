import { generateBlockHeader } from "@app/primitives/file/block-helpers";
import { LocalQueryManager } from "@app/services/local-query";
import { ColoringMode } from "@app/types";
import { Masonry } from "@app/utils/masonry";
import { SvgBaseElement, SvgGroupElement, SvgRectElement } from "@app/utils/svg";
import { action, computed, makeObservable, observable } from "mobx";

import { BAND_COLOR_RANGE, getBandColorScale } from "@giz/color-manager";
import { FileTree, Repository } from "@giz/explorer-web";
import { Maestro } from "@giz/maestro";
import { GizDate } from "@giz/utils/gizdate";

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
  @observable _isVisTypeModalOpen = false;

  @observable _isSvgLoading = false;

  @observable private _preferredColorScheme: "light" | "dark" = "light";

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

  get isVisTypeModalOpen() {
    return this._isVisTypeModalOpen;
  }

  @action.bound
  setVisTypeModalOpen(open: boolean) {
    this._isVisTypeModalOpen = open;
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

  setCommitStyles(commits: string[]) {
    const doc = document.documentElement;
    let styleElement = doc.querySelector("#commit-styles");
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "commit-styles";
      doc.append(styleElement);
    }
    let style = "";
    for (const commit of commits) {
      style += `.canvas:has(.commit-id_${commit}:hover) .commit-id_${commit} { filter: grayscale(80%); }\n`;
      //style += `.canvas:has(.commit-id_${commit}) .commit-id_${commit} { filter: grayscale(80%); }\n`;
    }

    styleElement.textContent = style;
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
    return (
      this._repo.state === "loading" || this._maestro.state === "loading" || this._isSvgLoading
    );
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
    return this.isLoading || this._maestro.loading;
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

  @action.bound
  setPreferredColorScheme(scheme: "light" | "dark") {
    this._preferredColorScheme = scheme;
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
    if ("devSettings" in this.settings) return this.settings.devSettings;
  }

  @action.bound
  setLocalQueryManager(manager: LocalQueryManager) {
    this._localQueryManager = manager;
  }

  @action.bound
  async exportAsSVG() {
    this._isSvgLoading = true;
    const blocks = await this._maestro.renderBlocksSvg();
    const numCols = Math.min(
      this.settings.visualizationSettings.canvas.masonryColumns.value,
      blocks.length,
    );
    const width = numCols * 300 + (numCols - 1) * 16 + 32;
    const TITLE_HEIGHT = 20;

    const masonry = new Masonry<SvgBaseElement>({ numColumns: numCols });
    for (const block of blocks) {
      if (!block) continue;

      const blockContainer = new SvgGroupElement(0, 0, 300, block.blockHeight + TITLE_HEIGHT);

      const header = generateBlockHeader({
        path: block.path,
        useStyleFn: this.getStyle.bind(this),
        noForeignObjects: true,
        maxTextWidth: 280,
      });

      const blockContent = new SvgGroupElement(0, 0, 300, block.blockHeight);
      if (typeof block.result === "string") {
        continue;
      }
      blockContent.assignChildren(...block.result);
      blockContent.transform = { x: 0, y: TITLE_HEIGHT };

      const border = new SvgRectElement({
        x: 0,
        y: 0,
        width: 300,
        height: block.blockHeight + TITLE_HEIGHT,
        fill: "transparent",
        stroke:
          this.preferredColorScheme === "light"
            ? this.getStyle("--color-gray")
            : this.getStyle("--color-darkslate"),
      });

      blockContainer.addChild(header);
      blockContainer.addChild(blockContent);
      blockContainer.addChild(border);

      masonry.insertElement({
        id: block.id,
        content: blockContainer,
        height: block.blockHeight + 26,
      });
    }

    masonry.sortAndPack();

    const svgChildren: SvgBaseElement[] = [];
    for (const [index, column] of masonry.columns.entries()) {
      for (const [columnIndex, child] of column.content.entries()) {
        child.content.transform = {
          x: index * 316 + 16,
          y: child.y + columnIndex * 16 + 32, // 16px gap between items, 32px padding to top
        };
        svgChildren.push(child.content);
      }
    }

    const styleTag = `xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink"`;
    const style = `style="background-color:${
      this.preferredColorScheme === "light"
        ? this.getStyle("--color-white")
        : this.getStyle("--color-darkgray")
    };font-family: Courier New;font-size: 0.5rem;"`;

    const svg = `<svg ${styleTag} ${style} viewBox="0 0 ${width} ${
      masonry.maxHeight + 32
    }">${svgChildren.map((c) => c.render()).join("")}</svg>`;

    const blob = new Blob([svg.toString()]);
    const element = document.createElement("a");
    const curDate = new GizDate();
    const repoNameDelimited = this.repoName === "?" ? "" : "_" + this.repoName;
    element.download = `gizual-export_${curDate.toFileString()}${repoNameDelimited}.svg`;
    element.href = window.URL.createObjectURL(blob);
    element.click();
    element.remove();
    this._isSvgLoading = false;
  }

  get localQueryManager() {
    return this._localQueryManager;
  }

  get preferredColorScheme() {
    return this._preferredColorScheme;
  }
}
