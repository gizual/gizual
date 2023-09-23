import { BranchInfo, CInfo } from "@app/types";
import {
  accumulateWheelTicks,
  convertDaysToMs,
  estimateCoordsOnScale,
  estimateDayOnScale,
  getDateFromTimestamp,
  getDaysBetweenAbs,
  getStringDate,
  GizDate,
  MOUSE_BUTTON_PRIMARY,
  MOUSE_BUTTON_WHEEL,
  MOUSE_ZOOM_FACTOR,
  MOUSE_ZOOM_FACTOR_FINE,
  normalizeWheelEventDirection,
} from "@app/utils";
import { autorun, makeAutoObservable, runInAction, when } from "mobx";
import { RefObject } from "react";

import { MainController } from "../../controllers";
import { AvailableTags } from "../search-bar/search-bar.vm";

export type ParsedBranch = BranchInfo & { commits?: CInfo[] };

const PRERENDER_MULTIPLIER = 3; // Changes the amount of sections to render. Should not be adjusted.
const DEFAULT_SELECTION = 365; // Default selection range - only used if the settings panel doesn't report this value.
const MIN_DAYS = 10; // Minimum amount days (used to restrict zooming).
const MAX_DAYS = 365 * PRERENDER_MULTIPLIER; // Maximum amount of days (used to restrict zooming).

export class TimelineViewModel {
  private _mainController: MainController;
  private _tooltipContent = "";
  private _isTooltipShown = false;

  private _commitsPerDate = new Map<string, CInfo[]>();
  private _commitsForBranch?: CInfo[];

  private _baseLayer?: RefObject<SVGGElement> = undefined;
  private _commitLayer?: RefObject<SVGGElement> = undefined;
  private _interactionLayer?: RefObject<HTMLDivElement> = undefined;
  private _timelineSvg?: RefObject<SVGSVGElement> = undefined;
  private _tooltip?: RefObject<HTMLDivElement> = undefined;

  // These dates are only used if the user explicitly does not specify a date
  // (by deleting the tag from the search bar).
  private _defaultStartDate?: GizDate;
  private _defaultEndDate?: GizDate;

  private _currentTranslationX = 0;
  private _dragStartX = 0;
  _isDragging = false;
  _isSelecting = false;

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
        this.initializePositionsFromLastCommit();
      },
    );

    this.loadCommitsForBranch();
    autorun(() => {
      if (this._mainController.branches.some((b) => b.name === this.selectedBranch))
        runInAction(() => this.loadCommitsForBranch());
    });

    this.setSelectedStartDate(new GizDate("2023-01-01"));
    this.setSelectedEndDate(new GizDate("2023-07-30"));
  }

  get selectionRange() {
    return (
      this._mainController.settingsController.settings.timelineSettings?.defaultRange?.value ??
      DEFAULT_SELECTION
    );
  }

  get isDoneLoading() {
    return this.lastCommit !== undefined;
  }

  initializePositionsFromLastCommit() {
    if (!this.lastCommit) return;

    const datePadding = Math.floor(this.selectionRange / 10);

    const newEndDate = getDateFromTimestamp(this.lastCommit.timestamp).addDays(datePadding);
    const newStartDate = getDateFromTimestamp(this.lastCommit.timestamp).subtractDays(
      datePadding + this.selectionRange,
    );

    const newSelectedStartDate = getDateFromTimestamp(this.lastCommit.timestamp).subtractDays(
      this.selectionRange,
    );
    const newSelectedEndDate = getDateFromTimestamp(this.lastCommit.timestamp);

    this.setStartDate(newStartDate);
    this.setEndDate(newEndDate);

    this.setSelectedStartDate(newSelectedStartDate);
    this.setSelectedEndDate(newSelectedEndDate);

    this._defaultStartDate = newSelectedStartDate;
    this._defaultEndDate = newSelectedEndDate;
  }

  get defaultStartDate() {
    return this._defaultStartDate;
  }

  get defaultEndDate() {
    return this._defaultEndDate;
  }

  get displayMode() {
    return getDaysBetweenAbs(this.startDate, this.endDate) >
      this.mainController.settingsController.settings.timelineSettings.weekModeThreshold.value
      ? "weeks"
      : "days";
  }

  get visibleUnitsForDisplayMode() {
    return this.displayMode === "days"
      ? this.totalVisibleDays
      : Math.floor(this.totalVisibleDays / 7);
  }

  get selectedUnitsForDisplayMode() {
    const days = Math.floor(getDaysBetweenAbs(this.selectedStartDate, this.selectedEndDate));
    return this.displayMode === "days" ? days : Math.floor(days / 7);
  }

  get dateRangeCenterText() {
    let str = "";
    str += `${this.visibleUnitsForDisplayMode} ${this.displayMode} visible`;

    str += ` - ${this.selectedUnitsForDisplayMode} ${this.displayMode} selected`;
    return str;
  }

  get isDragging() {
    return this._isDragging;
  }

  get isSelecting() {
    return this._isSelecting;
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
        estimateDayOnScale(
          this.timelineRenderStart,
          this.timelineRenderEnd,
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
          estimateDayOnScale(
            this.timelineRenderStart,
            this.timelineRenderEnd,
            this.viewBox.width,
            this._selectEndX + this._currentTranslationX,
          ),
        );
      });
    }

    if (this._isDragging) {
      this.applyTransform(this._dragStartX - e.clientX);
      this.updateSelectionStartCoords();
      this.updateSelectionEndCoords();
    }
  };

  mouseDown = (e: MouseEvent) => {
    if (e.button === MOUSE_BUTTON_PRIMARY) {
      runInAction(() => {
        this._isSelecting = true;

        this._selectStartX = e.clientX - this.interactionBoundingClientRect.left;
        this._selectEndX = e.clientX - this.interactionBoundingClientRect.left;

        let selectedStartDate = estimateDayOnScale(
          this.timelineRenderStart,
          this.timelineRenderEnd,
          this.viewBox.width,
          this._selectStartX + this._currentTranslationX,
        );
        let selectedEndDate = estimateDayOnScale(
          this.timelineRenderStart,
          this.timelineRenderEnd,
          this.viewBox.width,
          this._selectEndX + this._currentTranslationX,
        );

        if (this.mainController.settingsController.timelineSettings.snap.value) {
          selectedStartDate = selectedStartDate.discardTimeComponent();
          selectedEndDate = selectedEndDate.discardTimeComponent().addDays(1);
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
      this.stopSelecting();
    }

    if (e.button === MOUSE_BUTTON_WHEEL) {
      this.stopDragging();
    }
  };

  stopSelecting() {
    this._isSelecting = false;

    const selectedEndDate = estimateDayOnScale(
      this.timelineRenderStart,
      this.timelineRenderEnd,
      this.viewBox.width,
      this._selectEndX + this._currentTranslationX,
    );
    if (this.mainController.settingsController.timelineSettings.snap.value) {
      this.setSelectedEndDate(selectedEndDate.discardTimeComponent().addDays(1));
    }
  }

  stopDragging() {
    this._isDragging = false;
    const pxOffset = this._currentTranslationX - this.viewBox.width / PRERENDER_MULTIPLIER;
    this.move(pxOffset);
  }

  wheel = (e: WheelEvent) => {
    let ticks = 0;
    const delta = e ? normalizeWheelEventDirection(e) : 0;
    // eslint-disable-next-line unicorn/prefer-ternary
    if (Math.abs(delta) > 2) {
      // Probably a proper mouse wheel.
      ticks = Math.sign(delta);
    } else {
      // Probably something fine-grained (e.g. trackpad)
      ticks = accumulateWheelTicks(delta * MOUSE_ZOOM_FACTOR_FINE);
    }

    if (e.shiftKey || e.ctrlKey) {
      this.zoom(ticks);
      return;
    }

    this.move(-ticks * 20);
    this.updateSelectionStartCoords();
    this.updateSelectionEndCoords();
  };

  move(pxOffset: number) {
    const newStartDate = this.offsetDateByPx(this.startDate, pxOffset);
    const newEndDate = this.offsetDateByPx(this.endDate, pxOffset);

    this.setStartDate(newStartDate);
    this.setEndDate(newEndDate);

    this.applyTransform(this.viewBox.width / PRERENDER_MULTIPLIER);
  }

  zoom(ticks: number) {
    if (this.isZoomingOverBounds(ticks)) return;

    const currentRange = this.startDate.getTime() - this.endDate.getTime();
    let newStartDate = this.startDate.getTime();
    let newEndDate = this.endDate.getTime();
    let newRange = currentRange;

    newRange = currentRange * (1 + MOUSE_ZOOM_FACTOR * -ticks);

    newStartDate = this.startDate.getTime() - (currentRange - newRange) / 2;
    newEndDate = this.endDate.getTime() + (currentRange - newRange) / 2;

    this.setStartDate(new GizDate(newStartDate));
    this.setEndDate(new GizDate(newEndDate));
    this.updateSelectionStartCoords();
    this.updateSelectionEndCoords();
  }

  isZoomingOverBounds(ticks: number) {
    return (
      (getDaysBetweenAbs(this.startDate, this.endDate) < MIN_DAYS && ticks > 0) ||
      (getDaysBetweenAbs(this.startDate, this.endDate) > MAX_DAYS && ticks < 0)
    );
  }

  mouseEnter = () => {
    this.setTooltipShown(true);
  };

  mouseLeave = () => {
    this.setTooltipShown(false);
    if (this._isDragging) this.stopDragging();
    if (this._isSelecting) this.stopSelecting();
  };

  setTooltipShown(shown: boolean) {
    this._isTooltipShown = shown;
    if (this.tooltip) this.tooltip.style.visibility = shown ? "visible" : "hidden";
  }

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
    this._currentTranslationX = width / PRERENDER_MULTIPLIER;
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

  get lastCommit() {
    if (this._commitsForBranch === undefined || this._commitsForBranch.length === 0) return;
    return this._commitsForBranch?.at(0);
  }

  get selectedBranch() {
    return this.mainController.selectedBranch;
  }

  get commitsForBranch() {
    return this._commitsForBranch;
  }

  // TODO: This function is awkward, since it has a bunch of side effects and requires an `autorun`
  // to properly fit in the control flow. Should be refactored, probably the set of commits has to be constructed
  // elsewhere - maybe a separate controller that properly manages repo state.
  loadCommitsForBranch() {
    this._commitsForBranch = [];
    const parsedCommits: CInfo[] = [];
    const branch = this._mainController.branches.find((b) => b.name === this.selectedBranch);
    if (!branch) return;
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
    this._commitsPerDate.clear();

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

    this._commitsForBranch = parsedCommits;
  }

  setStartDate(date: GizDate) {
    this.mainController.setStartDate(date);
  }

  setSelectedStartDate(date?: GizDate) {
    if (date === undefined) date = this._defaultStartDate ?? new GizDate();
    this.mainController.setSelectedStartDate(date);
    this.updateSelectionStartCoords();
    this.zoom(0);
  }

  updateSelectionStartCoords() {
    const xCoords = estimateCoordsOnScale(
      this.timelineRenderStart,
      this.timelineRenderEnd,
      this.viewBox.width,
      this.selectedStartDate,
    );

    this._selectStartX = xCoords - this._currentTranslationX;
  }

  updateSelectionEndCoords() {
    const xCoords = estimateCoordsOnScale(
      this.timelineRenderStart,
      this.timelineRenderEnd,
      this.viewBox.width,
      this.selectedEndDate,
    );
    this._selectEndX = xCoords - this._currentTranslationX;
  }

  setEndDate(date: GizDate) {
    this.mainController.setEndDate(date);
  }

  setSelectedEndDate(date?: GizDate) {
    if (date === undefined) date = this._defaultStartDate ?? new GizDate();

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
    this.updateSelectionEndCoords();
    this.zoom(0);
  }

  get timelineRenderStart() {
    const daysBetween = getDaysBetweenAbs(
      this.mainController.startDate,
      this.mainController.endDate,
    );
    const newDate = this.mainController.startDate.subtractDays(daysBetween);
    return newDate;
  }

  get selectedStartDate() {
    return this.mainController.selectedStartDate;
  }

  get timelineRenderEnd() {
    const daysBetween = getDaysBetweenAbs(
      this.mainController.startDate,
      this.mainController.endDate,
    );
    return this.mainController.endDate.addDays(daysBetween);
  }

  get startDate() {
    return this.mainController.startDate;
  }

  get endDate() {
    return this.mainController.endDate;
  }

  get selectedEndDate() {
    return this.mainController.selectedEndDate;
  }

  get totalRenderedDays() {
    return getDaysBetweenAbs(this.timelineRenderStart, this.timelineRenderEnd);
  }

  get totalVisibleDays() {
    return Math.floor(getDaysBetweenAbs(this.startDate, this.endDate));
  }

  get dayWidthInPx() {
    return this.ruler.width / this.totalRenderedDays;
  }

  offsetDateByPx(startDate: Date, px: number): GizDate {
    const days = px / this.dayWidthInPx;

    return new GizDate(startDate.getTime() + convertDaysToMs(days));
  }

  applyTransform(x: number) {
    this._currentTranslationX = x;
    if (this.timelineSvg) {
      this.timelineSvg.style.transform = `translateX(${-x}px)`;
    }
  }
}
