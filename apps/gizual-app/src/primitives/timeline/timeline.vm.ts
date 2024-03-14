import { Dependencies, ViewModel } from "@app/services/view-model";
import { BranchInfo, CInfo } from "@app/types";
import { MOUSE_ZOOM_FACTOR } from "@app/utils";
import { ContextMenuContent } from "mantine-contextmenu";
import { action, computed, makeObservable, observable } from "mobx";
import { RefObject } from "react";

import { SearchQueryType } from "@giz/query";
import {
  convertDaysToMs,
  convertTimestampToMs,
  estimateCoordsOnScale,
  getDateFromTimestamp,
  getDaysBetweenAbs,
  GizDate,
} from "@giz/utils/gizdate";

import { TimelineEventHandler } from "./event-handler";

export type ParsedBranch = BranchInfo & { commits?: CInfo[] };

export const PRERENDER_MULTIPLIER = 3; // Changes the amount of sections to render. Should not be adjusted.
const DEFAULT_SELECTION = 365; // Default selection range - only used if the settings panel doesn't report this value.
const MIN_DAYS = 10; // Minimum amount days (used to restrict zooming).
const MAX_DAYS = 365 * PRERENDER_MULTIPLIER; // Maximum amount of days (used to restrict zooming).

type TimelineViewModelArgs = {
  query: SearchQueryType;
  updateQuery: (input: Partial<SearchQueryType>) => void;
};

class TimelineViewModel extends ViewModel {
  id = "timeline";

  @observable private _tooltipContent = "";
  @observable private _isTooltipShown = false;
  @observable private _isHoveringCommitId = -1;

  @observable private _interactionLayer?: RefObject<HTMLDivElement> = undefined;
  @observable private _timelineSvg?: RefObject<SVGSVGElement> = undefined;
  @observable private _tooltip?: RefObject<HTMLDivElement> = undefined;
  @observable private _isContextMenuOpen = false;

  @observable private _eventHandler: TimelineEventHandler;
  @observable private _eventCallbacks: Record<string, ((...args: any[]) => void)[]> = {};

  @observable private _currentTranslationX = 0;

  @observable private _startDate: GizDate;
  @observable private _selectedStartDate: GizDate;
  @observable private _endDate: GizDate;
  @observable private _selectedEndDate: GizDate;

  dragStartX = 0;
  selectStartX = 0;
  selectEndX = 0;
  moveBoxStartX = 0;
  resizeBoxStartLeft = 0;
  resizeBoxStartRight = 0;

  viewBox = {
    width: 1000,
    height: 120,
  };

  textColumnWidth = 120;
  rowHeight = 60;
  paddingY = 10;
  selectionBoxHandle = {
    width: 15,
    height: 35,
  };

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

  constructor({ mainController }: Dependencies, ...args: any[]) {
    super({ mainController }, ...args);

    this._startDate = new GizDate("2023-01-01");
    this._endDate = new GizDate("2023-07-30");
    this._selectedStartDate = new GizDate("1970-01-01");
    this._selectedEndDate = new GizDate("1970-01-01");

    this._eventHandler = new TimelineEventHandler(this);

    makeObservable(this, undefined);
  }

  // ------------------------------------------------------------------------ //

  // Actions
  @action.bound
  move(pxOffset: number) {
    const newStartDate = this.offsetDateByPx(this.startDate, pxOffset);
    const newEndDate = this.offsetDateByPx(this.endDate, pxOffset);

    this.setStartDate(newStartDate);
    this.setEndDate(newEndDate);

    this.applyTransform(this.viewBox.width / PRERENDER_MULTIPLIER);
  }

  @action.bound
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

  @action.bound
  isZoomingOverBounds(ticks: number) {
    return (
      (getDaysBetweenAbs(this.startDate, this.endDate) < MIN_DAYS && ticks > 0) ||
      (getDaysBetweenAbs(this.startDate, this.endDate) > MAX_DAYS && ticks < 0)
    );
  }

  @action.bound
  updateSelectionStartCoords() {
    const xCoords = estimateCoordsOnScale(
      this.timelineRenderStart,
      this.timelineRenderEnd,
      this.viewBox.width,
      this.selectedStartDate,
    );

    this.selectStartX = xCoords - this._currentTranslationX;
  }

  @action.bound
  updateSelectionEndCoords() {
    const xCoords = estimateCoordsOnScale(
      this.timelineRenderStart,
      this.timelineRenderEnd,
      this.viewBox.width,
      this.selectedEndDate,
    );
    this.selectEndX = xCoords - this._currentTranslationX;
  }

  @action.bound
  updateSelectionBoxCoords() {
    this.updateSelectionStartCoords();
    this.updateSelectionEndCoords();
  }

  @action.bound
  offsetDateByPx(startDate: Date, px: number): GizDate {
    const days = px / this.dayWidthInPx;

    return new GizDate(startDate.getTime() + convertDaysToMs(days));
  }

  @action.bound
  applyTransform(x: number) {
    this._currentTranslationX = x;
    if (this.timelineSvg) {
      this.timelineSvg.style.transform = `translateX(${-x}px)`;
    }
  }

  @action.bound
  on(
    event: "timelineSelection:changed",
    cb: (startDate: GizDate, endDate: GizDate) => void,
    fireImmediately = false,
  ) {
    this._eventCallbacks[event] = this._eventCallbacks[event] || [];
    this._eventCallbacks[event].push(cb);

    if (fireImmediately) {
      cb(this.selectedStartDate, this.selectedEndDate);
    }

    return {
      dispose: () => {
        this._eventCallbacks[event] = this._eventCallbacks[event].filter((fn) => fn !== cb);
      },
    };
  }

  notify(event: string, ...args: any[]) {
    if (!this._eventCallbacks[event]) return;

    for (const cb of this._eventCallbacks[event]) {
      cb(...args);
    }
  }

  /**
   * Function called by the EventHandler whenever the user finishes interacting with a part of the timeline
   */
  propagateUpdate() {
    this.notify("timelineSelection:changed", this.selectedStartDate, this.selectedEndDate);
  }

  // -------------------------------------------------------------------------- //

  // Setters
  @action.bound
  setTooltipContent(content: string) {
    this._tooltipContent = content;
  }

  @action.bound
  setTimelineSvg(ref?: RefObject<SVGSVGElement>) {
    this._timelineSvg = ref;
  }

  @action.bound
  setTooltipShown(shown: boolean) {
    this._isTooltipShown = shown;
    if (this.tooltip) this.tooltip.style.visibility = shown ? "visible" : "hidden";
  }

  @action.bound
  setInteractionLayer(ref?: RefObject<HTMLDivElement>) {
    this._interactionLayer = ref;

    if (this._interactionLayer?.current) {
      const interactionLayer = this._interactionLayer.current;
      this._eventHandler.attachParent(interactionLayer);
    }
  }

  @action.bound
  setTooltip(ref?: RefObject<HTMLDivElement>) {
    this._tooltip = ref;
    if (ref?.current) ref.current.style.visibility = "hidden";
  }

  @action.bound
  setViewBoxWidth(width: number) {
    this.viewBox.width = width;
    this._currentTranslationX = width / PRERENDER_MULTIPLIER;
  }

  @action.bound
  setSelectedStartDate(date?: GizDate) {
    if (date === undefined) date = this.defaultStartDate ?? new GizDate();
    if (getDaysBetweenAbs(date, this.selectedEndDate) < 1) {
      date = date.subtractDays(1);
    }

    if (this._selectedStartDate.getTime() !== date.getTime()) {
      this._selectedStartDate = date;
    }

    this.updateSelectionStartCoords();
    this.zoom(0);
  }

  @action.bound
  setSelectedEndDate(date?: GizDate) {
    if (date === undefined) date = this.defaultStartDate ?? new GizDate();
    if (getDaysBetweenAbs(date, this.selectedStartDate) < 1) {
      date = date.addDays(1);
    }

    if (this._selectedEndDate.getTime() !== date.getTime()) this._selectedEndDate = date;

    this.updateSelectionEndCoords();
    this.zoom(0);
  }

  @action.bound
  setIsHoveringCommitId(id: number) {
    this._isHoveringCommitId = id;
  }

  @action.bound
  setIsContextMenuOpen(open: boolean) {
    if (open) this.setTooltipShown(false);
    this._isContextMenuOpen = open;
  }

  @action.bound
  initializePositionsFromSelection() {
    const range = getDaysBetweenAbs(this.selectedEndDate, this.selectedStartDate);

    const datePadding = Math.floor(range / 10);

    const newStartDate = this.selectedStartDate.subtractDays(datePadding);
    const newEndDate = this.selectedEndDate.addDays(datePadding);

    this.setStartDate(newStartDate);
    this.setEndDate(newEndDate);

    this.updateSelectionBoxCoords();
  }

  @action.bound
  setStartDate(date: GizDate) {
    this._startDate = date;
  }

  @action.bound
  setEndDate(date: GizDate) {
    this._endDate = date;
  }

  // ------------------------------------------------------------------------ //

  // Computed
  get args() {
    return this._args[0] as TimelineViewModelArgs;
  }

  @computed
  get selectionRange() {
    return (
      this._mainController.settingsController.settings.timelineSettings.defaultRange.value ??
      DEFAULT_SELECTION
    );
  }

  get isDoneLoading() {
    return this.mainController.repoController.isDoneLoading;
  }

  get defaultStartDate() {
    return this.mainController.repoController.defaultStartDate;
  }

  get defaultEndDate() {
    return this.mainController.repoController.defaultEndDate;
  }

  @computed
  get displayMode() {
    return getDaysBetweenAbs(this.startDate, this.endDate) >
      this.mainController.settingsController.settings.timelineSettings.weekModeThreshold.value
      ? "weeks"
      : "days";
  }

  @computed
  get visibleUnitsForDisplayMode() {
    return this.displayMode === "days"
      ? this.totalVisibleDays
      : Math.floor(this.totalVisibleDays / 7);
  }

  @computed
  get selectedUnitsForDisplayMode() {
    const days = Math.floor(getDaysBetweenAbs(this.selectedStartDate, this.selectedEndDate));
    return this.displayMode === "days" ? days : Math.floor(days / 7);
  }

  @computed
  get dateRangeCenterText() {
    let str = "";
    str += `${this.visibleUnitsForDisplayMode} ${this.displayMode} visible`;

    str += ` - ${this.selectedUnitsForDisplayMode} ${this.displayMode} selected`;
    return str;
  }

  get isDragging() {
    return this._eventHandler.isDragging;
  }

  get isSelecting() {
    return this._eventHandler.isSelecting;
  }

  get isMovingSelectionBox() {
    return this._eventHandler.isMovingSelectionBox;
  }

  get isResizingSelectionBoxLeft() {
    return this._eventHandler.isResizingSelectionBox === "left";
  }

  get isResizingSelectionBoxRight() {
    return this._eventHandler.isResizingSelectionBox === "right";
  }

  get canResizeSelectionBoxLeft() {
    return this._eventHandler.canResizeSelectionBox === "left";
  }

  get canResizeSelectionBoxRight() {
    return this._eventHandler.canResizeSelectionBox === "right";
  }

  get timelineSvg() {
    return this._timelineSvg?.current;
  }

  get tooltipContent() {
    return this._tooltipContent;
  }

  get isTooltipShown() {
    return this._isTooltipShown;
  }

  get currentTranslationX() {
    return this._currentTranslationX;
  }

  get commitsPerDate() {
    return this.mainController.repoController.commitsPerDate;
  }

  get interactionLayer() {
    return this._interactionLayer?.current;
  }

  get tooltip() {
    return this._tooltip?.current;
  }

  get commitIndices() {
    return this.mainController.repoController.commitIndices;
  }

  get isHoveringCommitId() {
    return this._isHoveringCommitId;
  }

  get commits() {
    return this.mainController.repoController.commits;
  }

  get startDate() {
    return this._startDate;
  }

  get endDate() {
    return this._endDate;
  }

  @computed
  get selectedStartDate() {
    return this._selectedStartDate < this._selectedEndDate
      ? this._selectedStartDate
      : this._selectedEndDate;
  }

  @computed
  get selectedEndDate() {
    return this._selectedEndDate > this._selectedStartDate
      ? this._selectedEndDate
      : this._selectedStartDate;
  }

  @computed
  get commitsToDraw(): {
    commits: CInfo[];
    x: number;
    y: number;
    rx: number;
    originalPosition: number;
    interpolatedTimestamp: number;
  }[] {
    if (!this.commitsForBranch) return [];
    const radius = 10;

    const commitsToDraw: {
      commits: CInfo[];
      x: number;
      y: number;
      rx: number;
      originalPosition: number;
      interpolatedTimestamp: number;
    }[] = [];

    const commitsInRange = this.commitsForBranch!.filter(
      (c) =>
        getDateFromTimestamp(c.timestamp) > this.timelineRenderStart &&
        getDateFromTimestamp(c.timestamp) < this.timelineRenderEnd,
    );

    for (const commit of commitsInRange) {
      const commitDate = getDateFromTimestamp(commit.timestamp);
      const dateOffsetFromStart = getDaysBetweenAbs(commitDate, this.timelineRenderStart);
      const commitPos = dateOffsetFromStart * this.dayWidthInPx;

      // Compare this commit with the last one in `commitsToDraw` and see if we need to merge them.
      const previousCommits = commitsToDraw.at(-1);
      if (!previousCommits) {
        commitsToDraw.push({
          x: commitPos,
          y: 0,
          commits: [commit],
          rx: radius,
          originalPosition: commitPos,
          interpolatedTimestamp: convertTimestampToMs(commit.timestamp),
        });
        continue;
      }

      const previousCommitPos = previousCommits.x;
      const diff = Math.abs(previousCommitPos - commitPos);
      const diffToOriginal = Math.abs(previousCommits.originalPosition - previousCommitPos);
      if (diff < radius && diffToOriginal < radius * 2) {
        commitsToDraw.pop();
        commitsToDraw.push({
          x: commitPos + diff / 2,
          y: 0,
          commits: [...previousCommits.commits, commit],
          rx: diff + radius,
          originalPosition: previousCommits.originalPosition,
          interpolatedTimestamp:
            Math.abs(
              previousCommits.interpolatedTimestamp - convertTimestampToMs(commit.timestamp),
            ) + convertTimestampToMs(commit.timestamp),
        });
        continue;
      }

      commitsToDraw.push({
        x: commitPos,
        y: 0,
        commits: [commit],
        rx: radius,
        originalPosition: commitPos,
        interpolatedTimestamp: convertTimestampToMs(commit.timestamp),
      });
    }

    return commitsToDraw;
  }

  get selectedBranch() {
    return this.mainController.selectedBranch;
  }

  get commitsForBranch() {
    return this.mainController.repoController.commitsForBranch;
  }

  @computed
  get timelineRenderStart() {
    const daysBetween = getDaysBetweenAbs(this.startDate, this.endDate);
    const newDate = this.startDate.subtractDays(daysBetween);
    return newDate;
  }

  @computed
  get timelineRenderEnd() {
    const daysBetween = getDaysBetweenAbs(this.startDate, this.endDate);
    return this.endDate.addDays(daysBetween);
  }

  @computed
  get totalRenderedDays() {
    return getDaysBetweenAbs(this.timelineRenderStart, this.timelineRenderEnd);
  }

  @computed
  get totalVisibleDays() {
    return Math.floor(getDaysBetweenAbs(this.startDate, this.endDate));
  }

  @computed
  get dayWidthInPx() {
    return this.ruler.width / this.totalRenderedDays;
  }

  @computed
  get contextItems(): ContextMenuContent {
    let items: ContextMenuContent = [];

    if (this.isHoveringCommitId === -1) return items;

    if (!this.commitsToDraw.at(this.isHoveringCommitId)) {
      return [];
    }

    const earliestDate = getDateFromTimestamp(
      this.commitsToDraw.at(this.isHoveringCommitId)!.commits.at(-1)!.timestamp,
    );

    const latestDate = getDateFromTimestamp(
      this.commitsToDraw.at(this.isHoveringCommitId)!.commits.at(0)!.timestamp,
    );

    items = [
      {
        key: "start",
        title: "Start selection here",
        onClick: () => {
          this.setIsContextMenuOpen(false);
          this.setSelectedStartDate(earliestDate);
          this.propagateUpdate();
        },
      },
      {
        key: "end",
        title: "End selection here",
        onClick: () => {
          this.setIsContextMenuOpen(false);
          this.setSelectedEndDate(latestDate);
          this.propagateUpdate();
        },
      },
      ...items,
    ];

    return items;
  }

  get isContextMenuOpen() {
    return this._isContextMenuOpen;
  }

  // ------------------------------------------------------------------------ //

  get mainController() {
    return this._mainController;
  }
}

export { TimelineViewModel };
