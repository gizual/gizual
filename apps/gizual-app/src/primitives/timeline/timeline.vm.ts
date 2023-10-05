import { BranchInfo, CInfo } from "@app/types";
import {
  convertDaysToMs,
  convertTimestampToMs,
  estimateCoordsOnScale,
  getDateFromTimestamp,
  getDaysBetweenAbs,
  GizDate,
  logAllMethods,
  MOUSE_ZOOM_FACTOR,
} from "@app/utils";
import { MenuProps } from "antd";
import { makeAutoObservable } from "mobx";
import { RefObject } from "react";

import { MainController } from "../../controllers";

import { TimelineEventHandler } from "./event-handler";

export type ParsedBranch = BranchInfo & { commits?: CInfo[] };

export const PRERENDER_MULTIPLIER = 3; // Changes the amount of sections to render. Should not be adjusted.
const DEFAULT_SELECTION = 365; // Default selection range - only used if the settings panel doesn't report this value.
const MIN_DAYS = 10; // Minimum amount days (used to restrict zooming).
const MAX_DAYS = 365 * PRERENDER_MULTIPLIER; // Maximum amount of days (used to restrict zooming).

@logAllMethods("Timeline", "#e7bbf1")
export class TimelineViewModel {
  private _mainController: MainController;
  private _tooltipContent = "";
  private _isTooltipShown = false;
  private _isHoveringCommitId = -1;

  private _interactionLayer?: RefObject<HTMLDivElement> = undefined;
  private _timelineSvg?: RefObject<SVGSVGElement> = undefined;
  private _tooltip?: RefObject<HTMLDivElement> = undefined;
  private _isContextMenuOpen = false;

  private _eventHandler: TimelineEventHandler;

  private _currentTranslationX = 0;

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

  constructor(mainController: MainController) {
    this._mainController = mainController;
    this._mainController.vmController.setTimelineViewModel(this);
    this._eventHandler = new TimelineEventHandler(this);

    makeAutoObservable(this, {}, { autoBind: true });
    //this.setSelectedStartDate(new GizDate("2023-01-01"));
    //this.setSelectedEndDate(new GizDate("2023-07-30"));
  }

  // ------------------------------------------------------------------------ //

  // Actions
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

  updateSelectionStartCoords() {
    const xCoords = estimateCoordsOnScale(
      this.timelineRenderStart,
      this.timelineRenderEnd,
      this.viewBox.width,
      this.selectedStartDate,
    );

    this.selectStartX = xCoords - this._currentTranslationX;
  }

  updateSelectionEndCoords() {
    const xCoords = estimateCoordsOnScale(
      this.timelineRenderStart,
      this.timelineRenderEnd,
      this.viewBox.width,
      this.selectedEndDate,
    );
    this.selectEndX = xCoords - this._currentTranslationX;
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

  triggerSearchBarUpdate(force = true) {
    this.mainController.triggerSearchBarUpdate(force);
  }

  // -------------------------------------------------------------------------- //

  // Setters
  setTooltipContent(content: string) {
    this._tooltipContent = content;
  }

  setTimelineSvg(ref?: RefObject<SVGSVGElement>) {
    this._timelineSvg = ref;
  }

  setTooltipShown(shown: boolean) {
    this._isTooltipShown = shown;
    if (this.tooltip) this.tooltip.style.visibility = shown ? "visible" : "hidden";
  }

  setInteractionLayer(ref?: RefObject<HTMLDivElement>) {
    this._interactionLayer = ref;

    if (this._interactionLayer?.current) {
      const interactionLayer = this._interactionLayer.current;
      this._eventHandler.attachParent(interactionLayer);
    }
  }

  setTooltip(ref?: RefObject<HTMLDivElement>) {
    this._tooltip = ref;
    if (ref?.current) ref.current.style.visibility = "hidden";
  }

  setViewBoxWidth(width: number) {
    this.viewBox.width = width;
    this._currentTranslationX = width / PRERENDER_MULTIPLIER;
  }

  setStartDate(date: GizDate) {
    this.mainController.setStartDate(date);
  }

  setSelectedStartDate(date?: GizDate) {
    if (date === undefined) date = this.defaultStartDate ?? new GizDate();
    this.mainController.setSelectedStartDate(date);
    this.updateSelectionStartCoords();
    this.zoom(0);
  }

  setEndDate(date: GizDate) {
    this.mainController.setEndDate(date);
  }

  setSelectedEndDate(date?: GizDate) {
    if (date === undefined) date = this.defaultStartDate ?? new GizDate();

    this.mainController.setSelectedEndDate(date);
    this.updateSelectionEndCoords();
    this.zoom(0);
  }

  setIsHoveringCommitId(id: number) {
    this._isHoveringCommitId = id;
  }

  setIsContextMenuOpen(open: boolean) {
    if (open) this.setTooltipShown(false);
    this._isContextMenuOpen = open;
  }

  initializePositionsFromSelection() {
    console.log("initializePositionsFromSelection");
    const range = getDaysBetweenAbs(this.selectedEndDate, this.selectedStartDate);

    const datePadding = Math.floor(range / 10);

    const newStartDate = this.selectedStartDate.subtractDays(datePadding);
    const newEndDate = this.selectedEndDate.addDays(datePadding);

    this.setStartDate(newStartDate);
    this.setEndDate(newEndDate);
  }

  // ------------------------------------------------------------------------ //

  // Computed
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

  get timelineRenderStart() {
    const daysBetween = getDaysBetweenAbs(
      this.mainController.startDate,
      this.mainController.endDate,
    );
    const newDate = this.mainController.startDate.subtractDays(daysBetween);
    return newDate;
  }

  get timelineRenderEnd() {
    const daysBetween = getDaysBetweenAbs(
      this.mainController.startDate,
      this.mainController.endDate,
    );
    return this.mainController.endDate.addDays(daysBetween);
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

  get contextItems(): MenuProps["items"] {
    let items: MenuProps["items"] = [];
    items.push({
      key: "default",
      label: "Revert to default selection",
      danger: true,
      onClick: () => {
        this.setIsContextMenuOpen(false);
        this.mainController.repoController.initializePositionsFromLastCommit();
      },
    });

    if (this.isHoveringCommitId === -1) return items;

    const earliestDate = getDateFromTimestamp(
      this.commitsToDraw.at(this.isHoveringCommitId)!.commits.at(-1)!.timestamp,
    );

    const latestDate = getDateFromTimestamp(
      this.commitsToDraw.at(this.isHoveringCommitId)!.commits.at(0)!.timestamp,
    );

    items = [
      {
        key: "start",
        label: "Start selection here",
        onClick: () => {
          this.setIsContextMenuOpen(false);
          this.setSelectedStartDate(earliestDate);

          // Setting the end date is usually what triggers an update on the SearchBar.
          // If we're in here, we want this immediately.
          this.triggerSearchBarUpdate();
        },
      },
      {
        key: "end",
        label: "End selection here",
        onClick: () => {
          this.setIsContextMenuOpen(false);
          this.setSelectedEndDate(latestDate);
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

  // Shorthand getters for values on the MainController
  get mainController() {
    return this._mainController;
  }

  get startDate() {
    return this.mainController.startDate;
  }

  get endDate() {
    return this.mainController.endDate;
  }

  get selectedStartDate() {
    return this.mainController.selectedStartDate;
  }

  get selectedEndDate() {
    return this.mainController.selectedEndDate;
  }
}
