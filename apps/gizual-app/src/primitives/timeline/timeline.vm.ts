import { BranchInfo, CInfo } from "@app/types";
import {
  convertDaysToMs,
  DAYS_MS_FACTOR,
  discardTime,
  getDateFromTimestamp,
  getDayForXCoord,
  getDaysBetween,
  getStringDate,
  getXCoordsForDate,
} from "@app/utils";
import { makeAutoObservable, runInAction, when } from "mobx";
import { RefObject } from "react";

import { MainController } from "../../controllers";
import { AvailableTags } from "../search-bar/search-bar.vm";

export type ParsedBranch = BranchInfo & { commits?: CInfo[] };

const MOUSE_BUTTON_PRIMARY = 0;
const MOUSE_BUTTON_WHEEL = 1;

export class TimelineViewModel {
  private _mainController: MainController;
  private _laneSpacing = 1;
  private _commitSizeTop = 10;
  private _commitSizeModal = 5;
  private _wheelUnusedTicks = 0;
  private _tooltipContent = "";
  private _isTooltipShown = false;
  private _lastCommit?: CInfo;

  private _commitsPerDate = new Map<string, CInfo[]>();

  private _baseLayer?: RefObject<SVGGElement> = undefined;
  private _commitLayer?: RefObject<SVGGElement> = undefined;
  private _interactionLayer?: RefObject<HTMLDivElement> = undefined;
  private _timelineSvg?: RefObject<SVGSVGElement> = undefined;
  private _tooltip?: RefObject<HTMLDivElement> = undefined;

  private _currentTranslationX = 0;
  private _dragStartX = 0;
  private _isDragging = false;
  private _isSelecting = false;

  _selectStartX = 0;
  _selectEndX = 0;

  viewBox = {
    width: 1000,
    height: 120,
  };

  textColumnWidth = 120;
  rowHeight = 60;
  paddingY = 10;

  get ruler() {
    return {
      pos: {
        x: 0,
        y: this.rowHeight + this.paddingY,
      },
      width: this.viewBox.width,
      height: 50,
      ticks: {
        pos: {
          x: 0,
          y: 10,
        },
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

  private _isModalVisible = false;

  constructor(mainController: MainController) {
    this._mainController = mainController;
    this._mainController.vmController.setTimelineViewModel(this);

    makeAutoObservable(
      this,
      {
        mouseMove: false,
        mouseDown: false,
        mouseUp: false,
        wheel: false,
        mouseEnter: false,
        mouseLeave: false,
      },
      { autoBind: true },
    );

    when(
      () => this.isDoneLoading,
      () => {
        this.evaluatePositions();
      },
    );

    this.setSelectedStartDate(new Date("2023-01-01"));
    this.setSelectedEndDate(new Date("2023-07-30"));
  }

  get isDoneLoading() {
    return this._lastCommit !== undefined;
  }

  evaluatePositions() {
    if (!this._lastCommit) return;

    const newEndDate = new Date(
      getDateFromTimestamp(this._lastCommit.timestamp).getTime() + convertDaysToMs(365 + 10),
    );
    const newStartDate = new Date(
      getDateFromTimestamp(this._lastCommit.timestamp).getTime() - convertDaysToMs(365 * 2 + 10),
    );
    const newSelectedStartDate = new Date(
      getDateFromTimestamp(this._lastCommit.timestamp).getTime() - convertDaysToMs(365),
    );
    const newSelectedEndDate = getDateFromTimestamp(this._lastCommit.timestamp);

    this.setStartDate(newStartDate);
    this.setEndDate(newEndDate);
    this.setSelectedStartDate(newSelectedStartDate);
    this.setSelectedEndDate(newSelectedEndDate);
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

  get interactionBoundingClientRect() {
    return this.interactionLayer?.getBoundingClientRect() ?? new DOMRect();
  }

  get tooltipContent() {
    return this._tooltipContent;
  }

  get isTooltipShown() {
    return this._isTooltipShown;
  }

  mouseMove = (e: MouseEvent) => {
    if (this.tooltip) {
      this.tooltip.style.transform = `translate(${e.clientX + 15}px,${e.clientY + 15}px)`;
      this.tooltip.style.visibility = "visible";
      const date = getStringDate(
        getDayForXCoord(
          this.startDate,
          this.endDate,
          this.viewBox.width,
          e.clientX + this._currentTranslationX - this.interactionBoundingClientRect.left,
        ),
      );

      let tooltipContent = date;
      if (this._commitsPerDate.has(date)) {
        const commits = this._commitsPerDate.get(date)!;
        for (const commit of commits) {
          tooltipContent += "\n" + commit.message;
        }
      }

      runInAction(() => {
        this._tooltipContent = tooltipContent;
      });
    }

    if (this._isSelecting) {
      runInAction(() => {
        this._selectEndX = e.clientX - this.interactionBoundingClientRect.left;
        this.setSelectedEndDate(
          getDayForXCoord(
            this.startDate,
            this.endDate,
            this.viewBox.width,
            this._selectEndX + this._currentTranslationX,
          ),
        );
      });
    }

    if (this._isDragging) {
      this.applyTransform(this._dragStartX - e.clientX);
      this.updateStartX();
      this.updateEndX();
    }
  };

  mouseDown = (e: MouseEvent) => {
    if (e.button === MOUSE_BUTTON_PRIMARY) {
      runInAction(() => {
        this._isSelecting = true;

        this._selectStartX = e.clientX - this.interactionBoundingClientRect.left;
        this._selectEndX = e.clientX - this.interactionBoundingClientRect.left;
        console.log("Here's what selectStartX should be:", this._selectStartX);

        let selectedStartDate = getDayForXCoord(
          this.startDate,
          this.endDate,
          this.viewBox.width,
          this._selectStartX + this._currentTranslationX,
        );
        let selectedEndDate = getDayForXCoord(
          this.startDate,
          this.endDate,
          this.viewBox.width,
          this._selectEndX + this._currentTranslationX,
        );

        if (this.mainController.settingsController.timelineSettings.snap.value) {
          selectedStartDate = discardTime(selectedStartDate);
          selectedEndDate = new Date(discardTime(selectedEndDate).getTime() + DAYS_MS_FACTOR);
        }

        this.setSelectedStartDate(selectedStartDate);
        this.setSelectedEndDate(selectedEndDate);
      });
    }

    if (e.button === MOUSE_BUTTON_WHEEL) {
      runInAction(() => {
        this._isDragging = true;
        this._dragStartX = e.clientX + this._currentTranslationX;
      });
    }
  };

  mouseUp = (e: MouseEvent) => {
    if (e.button === MOUSE_BUTTON_PRIMARY) {
      this._isSelecting = false;

      const selectedEndDate = getDayForXCoord(
        this.startDate,
        this.endDate,
        this.viewBox.width,
        this._selectEndX + this._currentTranslationX,
      );
      if (this.mainController.settingsController.timelineSettings.snap.value) {
        this.setSelectedEndDate(new Date(discardTime(selectedEndDate).getTime() + DAYS_MS_FACTOR));
      }
    }

    if (e.button === MOUSE_BUTTON_WHEEL) {
      this._isDragging = false;
      const pxOffset = this._currentTranslationX - this.viewBox.width / 3;

      const newStartDate = this.offsetDateByPx(this.startDate, pxOffset);
      const newEndDate = this.offsetDateByPx(this.endDate, pxOffset);

      runInAction(() => {
        this.setStartDate(newStartDate);
        this.setEndDate(newEndDate);
      });
      this.applyTransform(this.viewBox.width / 3);
    }
  };

  wheel = (e?: WheelEvent) => {
    const scrollFactor = 0.05;

    let ticks = 0;
    const delta = e ? normalizeWheelEventDirection(e) : 0;
    // eslint-disable-next-line unicorn/prefer-ternary
    if (Math.abs(delta) > 2) {
      // Probably a proper mouse wheel.
      ticks = Math.sign(delta);
    } else {
      // Probably something fine-grained (e.g. trackpad)
      ticks = this.accumulateWheelTicks(delta * 0.005);
    }

    const currentRange = this.endDate.getTime() - this.startDate.getTime();
    let newStartDate = this.startDate.getTime();
    let newEndDate = this.endDate.getTime();
    let newRange = currentRange;

    newRange = currentRange * (1 + scrollFactor * -ticks);

    newStartDate = this.startDate.getTime() + (currentRange - newRange) / 2;
    newEndDate = this.endDate.getTime() - (currentRange - newRange) / 2;
    runInAction(() => {
      this.setStartDate(new Date(newStartDate));
      this.setEndDate(new Date(newEndDate));
    });
    this.updateStartX();
    this.updateEndX();
  };

  mouseEnter = () => {
    console.log("mouseEnter");
    runInAction(() => {
      this._isTooltipShown = true;
      if (this.tooltip) this.tooltip.style.visibility = "visible";
    });
  };

  mouseLeave = () => {
    runInAction(() => {
      this._isTooltipShown = false;
      if (this.tooltip) this.tooltip.style.visibility = "hidden";
    });
  };

  setInteractionLayer(ref?: RefObject<HTMLDivElement>) {
    this._interactionLayer = ref;

    if (this._interactionLayer?.current) {
      const interactionLayer = this._interactionLayer.current;

      // If we ever get here again, just remove the old listeners first for safety.
      interactionLayer.removeEventListener("mousemove", this.mouseMove);
      interactionLayer.removeEventListener("mousedown", this.mouseDown);
      interactionLayer.removeEventListener("mouseup", this.mouseUp);
      interactionLayer.removeEventListener("wheel", this.wheel);
      interactionLayer.removeEventListener("mouseenter", this.mouseEnter);
      interactionLayer.removeEventListener("mouseleave", this.mouseLeave);

      interactionLayer.addEventListener("mousemove", this.mouseMove);
      interactionLayer.addEventListener("mousedown", this.mouseDown);
      interactionLayer.addEventListener("mouseup", this.mouseUp);
      interactionLayer.addEventListener("wheel", this.wheel, { passive: true });
      interactionLayer.addEventListener("mouseenter", this.mouseEnter);
      interactionLayer.addEventListener("mouseleave", this.mouseLeave);
    }
  }

  get interactionLayer() {
    return this._interactionLayer?.current;
  }

  setTooltip(ref?: RefObject<HTMLDivElement>) {
    this._tooltip = ref;
  }

  get tooltip() {
    return this._tooltip?.current;
  }

  get mainController() {
    return this._mainController;
  }

  setViewBoxWidth(width: number) {
    this.viewBox.width = width;
    this._currentTranslationX = width / 3;
  }

  get laneSpacing() {
    return this._laneSpacing;
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
    this._lastCommit = currentCommit;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!currentCommit.parents) break;

      const parentId = currentCommit.parents[0];
      if (parentId === null) break;

      const commitIndex = this.commitIndices.get(parentId!);
      if (!commitIndex) break;

      currentCommit = this.commits[commitIndex];
      if (!currentCommit) break;

      const commitDate = getStringDate(getDateFromTimestamp(currentCommit.timestamp));
      if (this._commitsPerDate.has(commitDate)) {
        this._commitsPerDate.get(commitDate)?.push(currentCommit);
      } else {
        this._commitsPerDate.set(commitDate, [currentCommit]);
      }
      parsedCommits.push(currentCommit as any);
    }

    return parsedCommits;
  }

  setStartDate(date: Date) {
    this.mainController.setStartDate(date);
  }

  setSelectedStartDate(date: Date) {
    this.mainController.setSelectedStartDate(date);
    this.updateStartX();
    this.wheel();
  }

  updateStartX() {
    this._selectStartX =
      getXCoordsForDate(this.startDate, this.endDate, this.viewBox.width, this.selectedStartDate) -
      this._currentTranslationX;
  }

  updateEndX() {
    this._selectEndX =
      getXCoordsForDate(this.startDate, this.endDate, this.viewBox.width, this.selectedEndDate) -
      this._currentTranslationX;
  }

  setEndDate(date: Date) {
    this.mainController.setEndDate(date);
  }

  setSelectedEndDate(date: Date) {
    this.mainController.setSelectedEndDate(date);
    this.mainController.vmController.searchBarViewModel!.clear();
    this.mainController.vmController.searchBarViewModel?.appendTag(
      AvailableTags.start,
      getStringDate(this.selectedStartDate),
    );
    this.mainController.vmController.searchBarViewModel?.appendTag(
      AvailableTags.end,
      getStringDate(this.selectedEndDate),
    );
    this.updateEndX();
    this.wheel();
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

  offsetDateByPx(startDate: Date, px: number): Date {
    const days = px / this.dayWidthInPx;

    return new Date(startDate.getTime() + convertDaysToMs(days));
  }

  get selectedBranch(): ParsedBranch | undefined {
    if (this._mainController._repo.gitGraph.loading) return;

    const branch = this._mainController.branches?.find(
      (b) => b.name === this._mainController.selectedBranch,
    );
    if (!branch) return;

    return {
      ...branch,
      commits: this.getCommitsForBranch(branch),
    };
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

export function normalizeWheelEventDirection(evt: WheelEvent) {
  let delta = Math.hypot(evt.deltaX, evt.deltaY);
  const angle = Math.atan2(evt.deltaY, evt.deltaX);
  if (-0.25 * Math.PI < angle && angle < 0.75 * Math.PI) {
    // All that is left-up oriented has to change the sign.
    delta = -delta;
  }
  return delta;
}
