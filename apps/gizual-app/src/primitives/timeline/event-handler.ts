/**
 * This class is responsible for handling all events from the InteractionLayer
 * of the timeline component. These events directly modify the visible data,
 * which means that access to the original TimelineViewModel is required.
 */

import {
  accumulateWheelTicks,
  MOUSE_BUTTON_PRIMARY,
  MOUSE_BUTTON_WHEEL,
  MOUSE_ZOOM_FACTOR_FINE,
  normalizeWheelEventDirection,
} from "@app/utils";
import _ from "lodash";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { estimateDayOnScale, getDateFromTimestamp, getStringDate } from "@giz/utils/gizdate";

import { PRERENDER_MULTIPLIER, TimelineViewModel } from "./timeline.vm";

type EventCode = "mousemove" | "mouseup" | "mousedown" | "wheel" | "mouseenter" | "mouseleave";
type Receiver = { element: HTMLElement | SVGElement; events: EventCode[] };

export class TimelineEventHandler {
  vm: TimelineViewModel;

  @observable isDragging = false;
  @observable isSelecting = false;
  @observable isMovingSelectionBox = false;
  @observable isResizingSelectionBox: "left" | "right" | false = false;
  @observable canResizeSelectionBox: "left" | "right" | false = false;

  @observable _parent?: HTMLElement;
  _receivers?: Map<string, Receiver>;

  constructor(vm: TimelineViewModel) {
    this.vm = vm;
    makeObservable(this, undefined, { autoBind: true });
  }

  @action.bound
  attachParent(element: HTMLElement) {
    this._parent = element;

    // If we ever get here again, just remove the old listeners first for safety.
    element.removeEventListener("mousemove", this.mouseMove);
    element.removeEventListener("mousedown", this.mouseDown);
    element.removeEventListener("mouseup", this.mouseUp);
    element.removeEventListener("wheel", this.wheel);
    element.removeEventListener("mouseenter", this.mouseEnter);
    element.removeEventListener("mouseleave", this.mouseLeave);

    element.addEventListener("mousemove", this.mouseMove);
    element.addEventListener("mousedown", this.mouseDown);
    element.addEventListener("mouseup", this.mouseUp);
    element.addEventListener("wheel", this.wheel, { passive: true });
    element.addEventListener("mouseenter", this.mouseEnter);
    element.addEventListener("mouseleave", this.mouseLeave);
  }

  /**
   * Allows the caller to also receive the mouse events in the specified `element`.
   * Events are created synthetically (and there is a slight performance hit because of that).
   * All synthetic events are throttled to 50ms.
   *
   * The receiver is responsible for listening to the incoming events.
   *
   * @param id Unique id of the receiver
   * @param element HTMLElement that receives the synthetic events.
   * @param events Array of events to forward.
   */
  attachReceiver(id: string, element: HTMLElement | SVGElement, events: EventCode[]) {
    if (!this._receivers) this._receivers = new Map<string, Receiver>();
    this._receivers.set(id, { element, events });
  }

  private _forwardEvent = _.throttle((eventCode: EventCode, args: any) => {
    if (!this._receivers) return;
    for (const [_, receiver] of this._receivers.entries()) {
      if (!receiver.events.includes(eventCode)) {
        continue;
      }

      const event = new MouseEvent(eventCode, { ...args, bubbles: true });
      receiver.element.dispatchEvent(event);
    }
  }, 50).bind(this);

  @computed
  get parentBBox() {
    if (!this._parent) {
      return new DOMRect();
    }

    return this._parent.getBoundingClientRect();
  }

  mouseEnter = (e: MouseEvent) => {
    this._forwardEvent("mouseenter", e);
    this.vm.setTooltipShown(true);
  };

  mouseLeave = (e: MouseEvent) => {
    this._forwardEvent("mouseleave", e);
    this.vm.setTooltipShown(false);
    if (this.isDragging) this.stopDragging();
    if (this.isSelecting) this.stopSelecting();
    if (this.isMovingSelectionBox) this.stopMovingSelection();
    if (this.isResizingSelectionBox) this.stopResizingSelectionBox();
  };

  mouseUp = (e: MouseEvent) => {
    this._forwardEvent("mouseup", e);
    if (this.isSelecting) this.stopSelecting();
    if (this.isDragging) this.stopDragging();
    if (this.isMovingSelectionBox) this.stopMovingSelection();
    if (this.isResizingSelectionBox) this.stopResizingSelectionBox();
  };

  wheel = (e: WheelEvent) => {
    this._forwardEvent("wheel", e);
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
      this.vm.zoom(ticks);
      return;
    }

    // No extra key is pressed, so we perform a simple move operation.
    this.vm.move(-ticks * 20);
    this.vm.updateSelectionStartCoords();
    this.vm.updateSelectionEndCoords();
  };

  mouseMove = (e: MouseEvent) => {
    this._forwardEvent("mousemove", e);
    if (this.vm.isContextMenuOpen) return;
    if (this.vm.tooltip) {
      const date = estimateDayOnScale(
        this.vm.timelineRenderStart,
        this.vm.timelineRenderEnd,
        this.vm.viewBox.width,
        e.clientX + this.vm.currentTranslationX - this.parentBBox.left,
      ).toDisplayString();

      let tooltipContent = date;
      let hoveringId = -1;
      for (const [id, c] of this.vm.commitsToDraw.entries()) {
        const x = e.clientX - this.parentBBox.left + this.vm.currentTranslationX;
        if (x > c.x - c.rx && x < c.x + c.rx) {
          hoveringId = id;
          tooltipContent = c.commits
            .map((commit) => {
              let author = this.vm.mainController.getAuthorById(commit.aid)?.email ?? "";
              if (author.length > 50) author = author.slice(0, 46) + " ...";
              if (author) author = "<" + author + ">";

              let commitMessage = commit.message;
              if (commitMessage.length > 80) commitMessage = commitMessage.slice(0, 76) + " ...";

              return `┏━ ${getDateFromTimestamp(
                commit.timestamp,
              ).toDisplayString()} ${author}\n┗━ ${commitMessage}`;
            })
            .join("\n");
        }
      }
      this.vm.setIsHoveringCommitId(hoveringId);
      this.vm.setTooltipContent(tooltipContent);

      // eslint-disable-next-line unicorn/prefer-ternary
      if (
        e.clientX - this.parentBBox.left + this.vm.tooltip.clientWidth <
        this.parentBBox.width - 20
      )
        this.vm.tooltip.style.transform = `translate(${e.clientX + 15}px,${e.clientY + 15}px)`;
      else
        this.vm.tooltip.style.transform = `translate(${e.clientX - this.vm.tooltip.clientWidth}px,${
          e.clientY + 15
        }px)`;

      this.vm.tooltip.style.visibility = "visible";
    }

    if (this.isSelecting) {
      runInAction(() => {
        this.vm.selectEndX = e.clientX - this.parentBBox.left;
        this.vm.setSelectedEndDate(
          estimateDayOnScale(
            this.vm.timelineRenderStart,
            this.vm.timelineRenderEnd,
            this.vm.viewBox.width,
            this.vm.selectEndX + this.vm.currentTranslationX,
          ),
        );
      });
      return;
    }

    if (this.isDragging) {
      this.vm.applyTransform(this.vm.dragStartX - e.clientX);
      this.vm.updateSelectionStartCoords();
      this.vm.updateSelectionEndCoords();
      return;
    }

    if (this.isMovingSelectionBox) {
      const range = this.vm.selectEndX - this.vm.selectStartX;
      const dist = this.vm.moveBoxStartX - e.clientX;

      runInAction(() => {
        this.vm.selectStartX = this.vm.selectStartX - dist;
        this.vm.selectEndX = this.vm.selectStartX + range;
        this.vm.moveBoxStartX = this.vm.moveBoxStartX - dist;
      });
      return;
    }

    if (this.isResizingSelectionBox === "left") {
      const dist = this.vm.resizeBoxStartLeft - e.clientX;

      runInAction(() => {
        this.vm.selectStartX = this.vm.selectStartX - dist;
        this.vm.resizeBoxStartLeft = this.vm.resizeBoxStartLeft - dist;
      });
      return;
    }

    if (this.isResizingSelectionBox === "right") {
      const dist = this.vm.resizeBoxStartRight - e.clientX;

      runInAction(() => {
        this.vm.selectEndX = this.vm.selectEndX - dist;
        this.vm.resizeBoxStartRight = this.vm.resizeBoxStartRight - dist;
      });
      return;
    }

    runInAction(() => {
      this.canResizeSelectionBox = this.evaluateCanResize(e);
    });
  };

  evaluateCanResize(e: MouseEvent) {
    const posX = e.clientX - this.parentBBox.left;
    const posY = e.clientY - this.parentBBox.top;

    if (
      posY < this.vm.viewBox.height / 2 - this.vm.selectionBoxHandle.height / 2 ||
      posY > this.vm.viewBox.height / 2 + this.vm.selectionBoxHandle.height / 2
    )
      return false;

    if (
      posX > this.vm.selectStartX - this.vm.selectionBoxHandle.width &&
      posX < this.vm.selectStartX + this.vm.selectionBoxHandle.width
    )
      return "left";

    if (
      posX > this.vm.selectEndX - this.vm.selectionBoxHandle.width &&
      posX < this.vm.selectEndX + this.vm.selectionBoxHandle.width
    )
      return "right";

    return false;
  }

  mouseDown = (e: MouseEvent) => {
    this._forwardEvent("mousedown", e);
    if (e.button === MOUSE_BUTTON_PRIMARY && !e.altKey) {
      const mousePos = e.clientX - this.parentBBox.left;

      if (this.canResizeSelectionBox === "left") {
        this.isResizingSelectionBox = "left";
        this.vm.resizeBoxStartLeft = e.clientX;
        return;
      }

      if (this.canResizeSelectionBox === "right") {
        this.isResizingSelectionBox = "right";
        this.vm.resizeBoxStartRight = e.clientX;
        return;
      }

      if (mousePos > this.vm.selectStartX && mousePos < this.vm.selectEndX) {
        runInAction(() => {
          this.isMovingSelectionBox = true;
          this.vm.moveBoxStartX = e.clientX;
        });
        return;
      }

      runInAction(() => {
        this.isSelecting = true;

        this.vm.selectStartX = e.clientX - this.parentBBox.left;
        this.vm.selectEndX = e.clientX - this.parentBBox.left;

        this.setDatesFromSelectionCoordinates();
      });
    }

    if (e.button === MOUSE_BUTTON_WHEEL || (e.button === MOUSE_BUTTON_PRIMARY && e.altKey)) {
      runInAction(() => {
        this.isDragging = true;
        this.vm.dragStartX = e.clientX + this.vm.currentTranslationX;
      });
    }
  };

  @action.bound
  stopDragging() {
    this.isDragging = false;
    const pxOffset = this.vm.currentTranslationX - this.vm.viewBox.width / PRERENDER_MULTIPLIER;
    this.vm.move(pxOffset);
  }

  @action.bound
  stopSelecting() {
    this.isSelecting = false;

    const selectedEndDate = estimateDayOnScale(
      this.vm.timelineRenderStart,
      this.vm.timelineRenderEnd,
      this.vm.viewBox.width,
      this.vm.selectEndX + this.vm.currentTranslationX,
    );
    this.vm.propagateUpdate();
    if (this.vm.mainController.settingsController.timelineSettings.snap.value) {
      this.vm.setSelectedEndDate(selectedEndDate.discardTimeComponent().addDays(1));
    }
  }

  @action.bound
  stopMovingSelection() {
    this.isMovingSelectionBox = false;
    this.setDatesFromSelectionCoordinates();
    this.vm.propagateUpdate();
  }

  @action.bound
  setDatesFromSelectionCoordinates() {
    let selectedStartDate = estimateDayOnScale(
      this.vm.timelineRenderStart,
      this.vm.timelineRenderEnd,
      this.vm.viewBox.width,
      this.vm.selectStartX + this.vm.currentTranslationX,
    );
    let selectedEndDate = estimateDayOnScale(
      this.vm.timelineRenderStart,
      this.vm.timelineRenderEnd,
      this.vm.viewBox.width,
      this.vm.selectEndX + this.vm.currentTranslationX,
    );

    if (this.vm.mainController.settingsController.timelineSettings.snap.value) {
      selectedStartDate = selectedStartDate.discardTimeComponent();
      selectedEndDate = selectedEndDate.discardTimeComponent().addDays(1);
    }

    this.vm.setSelectedStartDate(selectedStartDate);
    this.vm.setSelectedEndDate(selectedEndDate);
  }

  @action.bound
  stopResizingSelectionBox() {
    this.isResizingSelectionBox = false;
    this.setDatesFromSelectionCoordinates();
    this.vm.propagateUpdate();
  }
}
