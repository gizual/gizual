import { IconDragVertical } from "@app/assets";
import { useWindowSize } from "@app/hooks/use-window-size";
import { useLocalQuery } from "@app/services/local-query";
import { useViewModel } from "@app/services/view-model";
import { NoVmError } from "@app/utils";
import { Loader } from "@mantine/core";
import clsx from "clsx";
import { useContextMenu } from "mantine-contextmenu";
import { observer } from "mobx-react-lite";
import React, { useRef } from "react";
import { createPortal } from "react-dom";

import { Commits } from "./commits";
import { RulerTicks } from "./ruler-ticks";
import style from "./timeline.module.scss";
import { TimelineViewModel } from "./timeline.vm";

const PRERENDER_MULTIPLIER = 3;

export type TimelineProps = {
  vm?: TimelineViewModel;
};

function Translate({
  x = 0,
  y = 0,
  children,
}: {
  x: number;
  y: number;
  children: React.ReactNode[] | React.ReactNode;
}) {
  return <g transform={`translate(${x},${y})`}>{children}</g>;
}

type TimelineGraphProps = {
  vm: TimelineViewModel;
  height?: number;
};

const TimelineGraph = observer(({ vm, height }: TimelineGraphProps) => {
  if (!vm.isDoneLoading) return <></>;
  if (!height) height = vm.rowHeight;
  return (
    <Translate x={0} y={0} data-test-id="timeline-graph">
      <rect
        x={0}
        y={0}
        width={vm.viewBox.width}
        height={height}
        strokeWidth={1}
        className={style.RectContainer}
      ></rect>
      <line
        x1={0}
        x2={vm.viewBox.width}
        y1={height / 2}
        y2={height / 2}
        stroke={"var(--foreground-primary)"}
        strokeWidth={4}
      />
    </Translate>
  );
});

export const BaseLayer = observer(({ vm }: TimelineProps) => {
  if (!vm) throw new NoVmError("BaseLayer");

  return (
    <g>
      <Ruler vm={vm} />
      <TimelineGraph vm={vm} />
    </g>
  );
});

export const CommitLayer = observer(({ vm }: TimelineProps) => {
  if (!vm) throw new NoVmError("CommitLayer");

  return (
    <g className={style.CommitLayer}>
      <Translate x={0} y={vm.rowHeight / 2}>
        <Commits
          selectionStartDate={vm.selectedStartDate}
          selectionEndDate={vm.selectedEndDate}
          commits={vm.commitsForBranch}
          radius={10}
          vm={vm}
        />
      </Translate>
    </g>
  );
});

export const InteractionLayer = observer(({ vm }: TimelineProps) => {
  if (!vm) throw new NoVmError("InteractionLayer");
  const { showContextMenu } = useContextMenu();

  const interactionLayerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    vm.setInteractionLayer(interactionLayerRef);
    vm.setTooltip(tooltipRef);
  }, [interactionLayerRef, tooltipRef]);

  const startPosX = `${Math.min(vm.selectStartX, vm.selectEndX)}px`;
  const width = `${Math.abs(vm.selectEndX - vm.selectStartX)}px`;

  return (
    <div
      onContextMenu={showContextMenu(vm.contextItems, {
        styles: { item: { backgroundColor: "var(--background-secondary)" } },
      })}
      className={clsx(
        vm.isDragging && style["InteractionLayer--isDragging"],
        vm.isSelecting && style["InteractionLayer--isSelecting"],
        vm.isMovingSelectionBox && style["InteractionLayer--isDragging"],
        vm.canResizeSelectionBoxLeft && style["InteractionLayer--isResizingLeft"],
        vm.canResizeSelectionBoxRight && style["InteractionLayer--isResizingRight"],
      )}
    >
      <div
        className={clsx(
          style.InteractionLayer,
          vm.isDragging && style["InteractionLayer--isDragging"],
        )}
        id={"TimelineInteractionLayer"}
        ref={interactionLayerRef}
      >
        {vm.isDoneLoading && (
          <>
            <div
              style={{
                left: startPosX,
                top: `0px`,
                width,
                height: `${vm.viewBox.height}px`,
              }}
              className={style.SelectionBox}
            >
              <div
                className={style.SelectionBoxDragHandle}
                style={{
                  left: `-${vm.selectionBoxHandle.width / 2}px`,
                  top: `${vm.viewBox.height / 2 - vm.selectionBoxHandle.height / 2}px`,
                  width: vm.selectionBoxHandle.width,
                  height: vm.selectionBoxHandle.height,
                }}
              >
                <IconDragVertical className={style.SelectionBoxDragHandleIcon} />
              </div>
              <div
                className={style.SelectionBoxDragHandle}
                style={{
                  right: `-${vm.selectionBoxHandle.width / 2}px`,
                  top: `${vm.viewBox.height / 2 - vm.selectionBoxHandle.height / 2}px`,
                  width: vm.selectionBoxHandle.width,
                  height: vm.selectionBoxHandle.height,
                }}
              >
                <IconDragVertical className={style.SelectionBoxDragHandleIcon} />
              </div>
            </div>
            <div
              style={{
                left: startPosX,
                top: `${vm.rowHeight}px`,
                height: 10,
                width: `${Math.abs(vm.selectStartX - vm.selectEndX) + 1}px`,
              }}
              className={style.SelectionBoxLine}
            />
          </>
        )}
        {!vm.isDragging && (
          <>
            <p className={style.DateRangeInfoText} style={{ left: 4 }}>
              {vm.startDate.toDisplayString()}
            </p>
            <p className={style.DateRangeCenterText}>{vm.dateRangeCenterText}</p>
            <p className={style.DateRangeInfoText} style={{ right: 4 }}>
              {vm.endDate.toDisplayString()}
            </p>
          </>
        )}
        {createPortal(
          <div id={"TimelineTooltip"} className={style.Tooltip} ref={tooltipRef}>
            <code className={style.TooltipContent}>{vm.tooltipContent}</code>
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
});

export const Ruler = observer(({ vm }: TimelineProps) => {
  if (!vm) throw new NoVmError("Ruler");
  return (
    <g data-test-id={"timeline-ruler"}>
      <rect
        x={0}
        y={vm.ruler.pos.y}
        width={vm.viewBox.width}
        height={vm.ruler.height}
        strokeWidth={1}
        className={style.RectContainer}
      ></rect>
      <Translate x={vm.ruler.pos.x} y={vm.ruler.pos.y}>
        <RulerTicks
          x={vm.ruler.ticks.pos.x}
          y={vm.ruler.ticks.pos.y}
          amount={vm.totalRenderedDays}
          emphasize={vm.ruler.ticks.emphasisOpts}
          tickSize={vm.ruler.ticks.tickSize}
          startDate={vm.timelineRenderStart}
          dayWidth={vm.dayWidthInPx}
          displayMode={vm.displayMode}
        />
      </Translate>
    </g>
  );
});

export const Timeline = observer(() => {
  const { updateLocalQuery, publishLocalQuery, rangeByDate } = useLocalQuery();
  const vm = useViewModel(TimelineViewModel);

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const timelineSvgWrapperRef = useRef<HTMLDivElement>(null);

  const timelineSvgRef = useRef<SVGSVGElement>(null);
  React.useEffect(() => vm.setTimelineSvg(timelineSvgRef), [timelineSvgRef]);

  // This LayoutEffect is pretty much the only time we actually need to re-render
  // the entire component, because the dimensions of the viewport must be changed
  // to adhere the dimensions of the parent.
  const [width, _] = useWindowSize();
  React.useLayoutEffect(() => {
    const containerWidth = timelineContainerRef.current?.clientWidth ?? 1000;

    const timelineSvgWrapperWidth = containerWidth; //previously: containerWidth - vm.textColumnWidth - 3 * vm.padding;
    const timelineSvgWrapper = timelineSvgWrapperRef?.current;
    if (timelineSvgWrapper) {
      timelineSvgWrapper.style.left = "0"; //previous: `${vm.textColumnWidth}px`;
      timelineSvgWrapper.style.width = `${timelineSvgWrapperWidth}px`;
    }
    const timelineSvg = timelineSvgRef?.current;
    if (timelineSvg) {
      timelineSvg.style.width = `${timelineSvgWrapperWidth * PRERENDER_MULTIPLIER}px`;
    }
    vm.setViewBoxWidth(timelineSvgWrapperWidth * PRERENDER_MULTIPLIER);
    vm.updateSelectionStartCoords();
    vm.updateSelectionEndCoords();
  }, [vm, timelineContainerRef, timelineSvgWrapperRef, vm.commitsForBranch, width]);

  // If the query changed, update the start & end dates and re-center the timeline.
  React.useEffect(() => {
    if (rangeByDate) {
      vm.updateSelectedDates(rangeByDate[0], rangeByDate[1]);
    }
  }, [rangeByDate]);

  React.useEffect(() => {
    const event = vm.on("timelineSelection:changed", () => {
      updateLocalQuery({
        time: {
          rangeByDate: [vm.selectedStartDate.toString(), vm.selectedEndDate.toString()],
        },
      });
      publishLocalQuery();
    });

    return () => {
      event.dispose();
    };
  }, [updateLocalQuery, publishLocalQuery, vm]);

  return (
    <div className={style.TimelineComponent} id={"TimelineComponent"}>
      <div className={style.TimelineContainer} ref={timelineContainerRef}>
        <div className={style.TimelineSvgWrapper} ref={timelineSvgWrapperRef}>
          <svg
            width={"100%"}
            height={"100%"}
            viewBox={`0 0 ${vm.viewBox.width} ${vm.viewBox.height}`}
            className={style.Svg}
            ref={timelineSvgRef}
            style={{ transform: `translateX(${-vm.viewBox.width / 3}px)` }}
          >
            <BaseLayer vm={vm} />
            <CommitLayer vm={vm} />
          </svg>
          <InteractionLayer vm={vm} />
          {!vm.isDoneLoading && (
            <div className={style.NotLoadedOverlay}>
              <div className={style.NotLoadedOverlayContent}>
                <Loader size={"md"} />
                <h2>Loading branches & commits. Please wait ... </h2>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
