import { makeAutoObservable, toJS } from "mobx";

import { MainController } from "../../controllers";
import { BranchInfo, CInfo } from "@app/types";

export type ParsedBranch = BranchInfo & { commits?: CInfo[] };

export class TimelineViewModel {
  private _mainController: MainController;
  private _isCommitTooltipVisible = false;
  private _commitTooltip: CInfo | undefined;
  private _laneSpacing = 1;
  private _commitSizeTop = 10;
  private _commitSizeModal = 5;

  viewBox = {
    width: 1000,
    height: 200,
  };

  leftColWidth = 120;
  rulerHeight = 80;
  rowHeight = 80;
  padding = 20;
  smallTickHeight = 10;
  largeTickHeight = 20;

  ruler = {
    pos: {
      x: this.leftColWidth,
      y: this.padding,
    },
  };

  graphs = {
    pos: {
      x: 0,
      y: this.rulerHeight + this.padding * 2,
    },
  };

  private _isModalVisible = false;

  constructor(mainController: MainController) {
    this._mainController = mainController;

    makeAutoObservable(this);
  }

  get mainController() {
    return this._mainController;
  }

  get rulerWidth() {
    return this.viewBox.width - this.leftColWidth - 3 * this.padding;
  }

  setViewBoxWidth(width: number) {
    this.viewBox.width = width;
  }

  get isModalVisible() {
    return this._isModalVisible;
  }

  toggleModal() {
    this._isModalVisible = !this._isModalVisible;
  }

  showTooltip(commit: CInfo, x: number, y: number) {
    this._commitTooltip = commit;
    this._isCommitTooltipVisible = true;
  }

  hideTooltip() {
    this._commitTooltip = undefined;
    this._isCommitTooltipVisible = false;
  }

  get isCommitTooltipVisible() {
    return this._isCommitTooltipVisible;
  }

  get commitTooltip() {
    return this._commitTooltip;
  }

  get laneSpacing() {
    return this._laneSpacing;
  }

  setSpacing(n: number | null) {
    this._laneSpacing = n ?? 1;
  }

  get commitSizeTop() {
    return this._commitSizeTop;
  }

  setCommitSizeTop(n: number | null) {
    this._commitSizeTop = n ?? 10;
  }

  get commitSizeModal() {
    return this._commitSizeModal;
  }

  setCommitSizeModal(n: number | null) {
    this._commitSizeModal = n ?? 5;
  }

  setActiveBranch(branch: BranchInfo) {
    this.mainController.setBranchByName(branch.name);
  }

  get commitIndices() {
    if (this.mainController._repo.gitGraph.loading) return;
    return new Map<string, number>(
      Object.entries(this.mainController._repo.gitGraph.value?.commit_indices ?? {})
    );
  }

  get commits() {
    if (this.mainController._repo.gitGraph.loading) return [];
    return this.mainController._repo.gitGraph.value?.commits ?? [];
  }

  getCommitsForBranch(branch: BranchInfo) {
    const parsedCommits: CInfo[] = [];
    const origin = branch.last_commit_id;

    if (!this.commitIndices) return;

    const originIndex = this.commitIndices.get(origin);

    if (originIndex === undefined) {
      console.log(
        "Aborting, cannot find origin in indices, origin:",
        origin,
        "indices:",
        this.commitIndices
      );
      return parsedCommits;
    } //throw new Error(`Could not find commit index for commit ${origin}`);

    const commit = this.commits[originIndex];
    parsedCommits.push(commit);

    let currentCommit = commit;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!currentCommit.parents) break;

      const parentId = currentCommit.parents[0];
      if (parentId === null) break;

      const commitIndex = this.commitIndices.get(parentId!);
      if (!commitIndex) break;

      currentCommit = this.commits[commitIndex];
      if (!currentCommit) break;

      parsedCommits.push(currentCommit as any);
    }

    return parsedCommits;
  }

  get branches(): ParsedBranch[] | undefined {
    if (this._mainController._repo.gitGraph.loading) return;

    return this._mainController.branches.map((branch) => {
      return {
        ...branch,
        commits: this.getCommitsForBranch(branch),
      };
    });
  }

  get selectedBranch(): ParsedBranch | undefined {
    if (this._mainController._repo.gitGraph.loading) return;

    return this.branches?.find((b) => b.name === this._mainController.selectedBranch);
  }
}
