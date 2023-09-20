import { BranchInfo, CInfo } from "@app/types";
import { makeAutoObservable } from "mobx";
import { RefObject } from "react";

import { MainController } from "../../controllers";

export type ParsedBranch = BranchInfo & { commits?: CInfo[] };

export function convertMsToDays(ms: number) {
  return ms / (1000 * 60 * 60 * 24);
}

export function getDaysBetween(start: Date, end: Date) {
  return Math.round(Math.abs(convertMsToDays(start.getTime() - end.getTime())));
}

export class TimelineViewModel {
  private _mainController: MainController;
  private _isCommitTooltipVisible = false;
  private _commitTooltip: CInfo | undefined;
  private _laneSpacing = 1;
  private _commitSizeTop = 10;
  private _commitSizeModal = 5;
  private _wheelUnusedTicks = 0;

  private _baseLayer?: RefObject<SVGGElement> = undefined;
  private _commitLayer?: RefObject<SVGGElement> = undefined;
  private _interactionLayer?: RefObject<HTMLDivElement> = undefined;
  private _timelineSvg?: RefObject<SVGSVGElement> = undefined;

  private _currentTranslationX = 0;
  private _dragStartX = 0;
  private _isDragging = false;

  // Timeline dimensions. All values in px.
  viewBox = {
    width: 1000,
    height: 200,
  };

  textColumnWidth = 120;
  rowHeight = 80;
  padding = 20;

  get ruler() {
    return {
      pos: {
        x: this.textColumnWidth,
        y: this.padding,
      },
      width: this.viewBox.width - this.textColumnWidth - 3 * this.padding,
      height: 80,
      ticks: {
        emphasisOpts: {
          distance: 7,
          height: 20,
          width: 2,
        },
        tickSize: {
          height: 10,
          width: 1,
        },
      },
    };
  }

  get graphs() {
    return {
      pos: {
        x: 0,
        y: this.ruler.height + this.padding * 2,
      },
    };
  }

  private _isModalVisible = false;

  constructor(mainController: MainController) {
    this._mainController = mainController;

    makeAutoObservable(this);
  }

  setTimelineSvg(ref?: RefObject<SVGSVGElement>) {
    this._timelineSvg = ref;
  }

  get timelineSvg() {
    return this._timelineSvg?.current;
  }

  setBaseLayer(ref?: RefObject<SVGGElement>) {
    this._baseLayer = ref;
  }

  get baseLayer() {
    return this._baseLayer?.current;
  }

  setCommitLayer(ref?: RefObject<SVGGElement>) {
    this._commitLayer = ref;
  }

  get commitLayer() {
    return this._commitLayer?.current;
  }

  setInteractionLayer(ref?: RefObject<HTMLDivElement>) {
    this._interactionLayer = ref;
    if (this._interactionLayer?.current) {
      const interactionLayer = this._interactionLayer.current;
      interactionLayer.addEventListener(
        "mousemove",
        (e) => {
          if (!this._isDragging) return;
          this.applyTransform(this._dragStartX - e.clientX);
        },
        true,
      );
      interactionLayer.addEventListener("mousedown", (e) => {
        this._isDragging = true;
        this._dragStartX = e.clientX + this._currentTranslationX;
      });
      interactionLayer.addEventListener("mouseup", () => {
        this._isDragging = false;
      });
    }
  }

  get interactionLayer() {
    return this._interactionLayer?.current;
  }

  get mainController() {
    return this._mainController;
  }

  get rulerWidth() {
    return this.viewBox.width - this.textColumnWidth - 3 * this.padding;
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

  showTooltip(commit: CInfo) {
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
    this.toggleModal();
  }

  get commitIndices() {
    if (this.mainController._repo.gitGraph.loading) return;
    return new Map<string, number>(
      Object.entries(this.mainController._repo.gitGraph.value?.commit_indices ?? {}),
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
        this.commitIndices,
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

  setStartDate(date: Date) {
    this.mainController.setStartDate(date);
  }

  setSelectedStartDate(date: Date) {
    this.mainController.setSelectedStartDate(date);
  }

  setEndDate(date: Date) {
    this.mainController.setEndDate(date);
  }

  setSelectedEndDate(date: Date) {
    this.mainController.setSelectedEndDate(date);
  }

  get startDate() {
    return this.mainController.startDate;
  }

  get selectedStartDate() {
    return this.mainController.selectedStartDate;
  }

  get endDate() {
    return this.mainController.endDate;
  }

  get selectedEndDate() {
    return this.mainController.selectedEndDate;
  }

  get daysFromStartToEnd() {
    return getDaysBetween(this.startDate, this.endDate);
  }

  get dayWidthInPx() {
    return this.ruler.width / this.daysFromStartToEnd;
  }

  get selectedBranch(): ParsedBranch | undefined {
    if (this._mainController._repo.gitGraph.loading) return;

    return this.branches?.find((b) => b.name === this._mainController.selectedBranch);
  }

  applyTransform(x: number) {
    this._currentTranslationX = x;
    if (this.timelineSvg) {
      this.timelineSvg.style.transform = `translateX(${-x}px)`;
    }
  }

  accumulateWheelTicks(ticks: number) {
    // If the scroll direction changed, reset the accumulated wheel ticks.
    if ((this._wheelUnusedTicks > 0 && ticks < 0) || (this._wheelUnusedTicks < 0 && ticks > 0)) {
      this._wheelUnusedTicks = 0;
    }
    this._wheelUnusedTicks += ticks;
    const wholeTicks =
      Math.sign(this._wheelUnusedTicks) * Math.floor(Math.abs(this._wheelUnusedTicks));
    this._wheelUnusedTicks -= wholeTicks;
    return wholeTicks;
  }
}

export function normalizeWheelEventDirection(evt: React.WheelEvent<SVGSVGElement | undefined>) {
  let delta = Math.hypot(evt.deltaX, evt.deltaY);
  const angle = Math.atan2(evt.deltaY, evt.deltaX);
  if (-0.25 * Math.PI < angle && angle < 0.75 * Math.PI) {
    // All that is left-up oriented has to change the sign.
    delta = -delta;
  }
  return delta;
}

export function getDateFromTimestamp(timestamp: string) {
  return new Date(Number(timestamp) * 1000);
}

export function getDayFromOffset(offset: number, startDate: Date) {
  const d = new Date(startDate.getTime() + offset * 1000 * 60 * 60 * 24);
  //console.log("getDayFromOffset", offset, startDate, "=", d);
  return d;
}

export function getDateString(date: Date) {
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}
