import { BranchInfo } from "@app/types";
import { NoVmError, useWindowSize } from "@app/utils";
import { observer } from "mobx-react-lite";
import React, { useRef } from "react";

import { useMainController, useViewModelController } from "../../controllers";
import { Button } from "../button";

import { Commits } from "./commits";
import { RulerTicks } from "./ruler-ticks";
import style from "./timeline.module.scss";
import { getDateString, TimelineViewModel } from "./timeline.vm";

//const MOUSE_BUTTON_PRIMARY = 1;
//const MOUSE_BUTTON_WHEEL = 4;
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
  commits?: React.ReactElement;
  branch?: BranchInfo;
  isBelowRuler?: boolean;
  height?: number;
};

const TimelineGraph = observer(
  ({ commits, branch, vm, isBelowRuler, height }: TimelineGraphProps) => {
    if (!branch) return <></>;
    const offset = isBelowRuler ? vm.graphs.pos : { x: 0, y: 0 };
    if (!height) height = vm.rowHeight;
    return (
      <Translate {...offset} data-test-id="timeline-graph">
        <foreignObject
          x={vm.padding}
          y={0}
          width={vm.textColumnWidth - 2 * vm.padding}
          height={height}
        >
          <div
            style={{
              width: "90%",
              height: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              position: "relative",
              cursor: "pointer",
            }}
            onClick={() => vm.setActiveBranch(branch)}
          >
            <p className={style.BranchName}>{branch.name}</p>
          </div>
        </foreignObject>
        <rect
          x={vm.textColumnWidth - vm.padding}
          y={0}
          width={vm.viewBox.width - vm.textColumnWidth - vm.padding}
          height={height}
          strokeWidth={1}
          className={style.RectContainer}
        ></rect>
        <Translate x={vm.textColumnWidth - vm.padding} y={0}>
          <line
            x1={0}
            x2={vm.viewBox.width - vm.textColumnWidth - vm.padding}
            y1={height / 2}
            y2={height / 2}
            stroke={"white"}
            strokeWidth={4}
          />

          <Translate x={vm.padding} y={0}>
            {commits}
          </Translate>
        </Translate>
      </Translate>
    );
  },
);

export const BaseLayer = observer(({ vm }: TimelineProps) => {
  if (!vm) throw new NoVmError("BaseLayer");

  const ref = useRef<SVGGElement | null>(null);
  React.useEffect(() => {
    vm.setBaseLayer(ref);
    return vm.setBaseLayer();
  }, [ref]);

  return (
    <g ref={ref}>
      <Ruler vm={vm} />
      <TimelineGraph vm={vm} branch={vm.selectedBranch} />
    </g>
  );
});

export const CommitLayer = observer(({ vm }: TimelineProps) => {
  if (!vm) throw new NoVmError("CommitLayer");

  const ref = useRef<SVGGElement | null>(null);
  React.useEffect(() => {
    vm.setCommitLayer(ref);
    return vm.setCommitLayer();
  }, [ref]);

  return (
    <g ref={ref}>
      <Translate x={vm.textColumnWidth} y={vm.rowHeight / 2}>
        <Commits
          startDate={vm.startDate}
          endDate={vm.endDate}
          selectionStartDate={vm.selectedStartDate}
          selectionEndDate={vm.selectedEndDate}
          dayWidth={vm.dayWidthInPx}
          commits={vm.selectedBranch?.commits}
          yOffset={vm.rowHeight / 2}
          radius={vm.commitSizeTop}
          vm={vm}
        />
      </Translate>
    </g>
  );
});

export const InteractionLayer = observer(({ vm }: TimelineProps) => {
  if (!vm) throw new NoVmError("InteractionLayer");

  const ref = useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    vm.setInteractionLayer(ref);
    return vm.setInteractionLayer();
  }, [ref]);

  return <div className={style.InteractionLayer} id={"TimelineInteractionLayer"} ref={ref}></div>;
});

export const Ruler = observer(({ vm }: TimelineProps) => {
  if (!vm) throw new NoVmError("Ruler");
  return (
    <g data-test-id={"timeline-ruler"}>
      <rect
        x={vm.textColumnWidth - vm.padding}
        y={vm.graphs.pos.y}
        width={vm.viewBox.width - vm.textColumnWidth - vm.padding}
        height={vm.ruler.height}
        strokeWidth={1}
        className={style.RectContainer}
      ></rect>
      <text
        x={vm.textColumnWidth}
        y={vm.ruler.height - vm.padding + vm.graphs.pos.y}
        className={style.RulerAnnotationLeft}
      >
        {getDateString(vm.startDate)}
      </text>
      <text
        x={vm.viewBox.width - 3 * vm.padding}
        y={vm.ruler.height - vm.padding + vm.graphs.pos.y}
        className={style.RulerAnnotationRight}
      >
        {getDateString(vm.endDate)}
      </text>
      <Translate x={vm.ruler.pos.x} y={vm.ruler.pos.y}>
        <RulerTicks
          x={0}
          y={vm.graphs.pos.y}
          width={vm.rulerWidth}
          amount={vm.daysFromStartToEnd}
          emphasize={vm.ruler.ticks.emphasisOpts}
          tickSize={vm.ruler.ticks.tickSize}
          startDate={vm.startDate}
        />
      </Translate>
    </g>
  );
});

export const Timeline = observer(({ vm: externalVm }: TimelineProps) => {
  const mainController = useMainController();
  const vmController = useViewModelController();

  const vm: TimelineViewModel = React.useMemo(() => {
    return externalVm || new TimelineViewModel(mainController);
  }, [externalVm]);

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
    vm.setViewBoxWidth(containerWidth * 3);

    const timelineSvgWrapper = timelineSvgWrapperRef?.current;
    if (timelineSvgWrapper) {
      timelineSvgWrapper.style.left = `${vm.textColumnWidth}px`;
      timelineSvgWrapper.style.width = `${containerWidth - vm.textColumnWidth - 3 * vm.padding}px`;
    }
  }, [
    timelineContainerRef,
    vmController.isRepoPanelVisible,
    vmController.isSettingsPanelVisible,
    vm.branches,
    width,
  ]);

  return (
    <div className={style.TimelineComponent} id={"TimelineComponent"}>
      <div className={style.TimelineHeader}>
        <h1 className={style.Header}>Timeline</h1>
        <Button
          variant={"filled"}
          onClick={() => vm.toggleModal()}
          style={{ width: "80px", marginRight: "1rem" }}
        >
          {vm.isModalVisible ? "Close" : "Expand"}
        </Button>
      </div>

      <div className={style.TimelineContainer} ref={timelineContainerRef}>
        <div className={style.TimelineSvgWrapper} ref={timelineSvgWrapperRef}>
          <svg
            width={"100%"}
            height={"100%"}
            viewBox={`0 0 ${vm.viewBox.width} ${vm.viewBox.height}`}
            className={style.Svg}
            ref={timelineSvgRef}
          >
            <BaseLayer vm={vm} />
            <CommitLayer vm={vm} />
          </svg>

          <InteractionLayer vm={vm} />
        </div>
      </div>
    </div>
  );
});

//export const TimelineOld = observer(({ vm: externalVm }: TimelineProps) => {
//  const mainController = useMainController();
//  const vmController = useViewModelController();
//
//  const vm: TimelineViewModel = React.useMemo(() => {
//    return externalVm || new TimelineViewModel(mainController);
//  }, [externalVm]);
//
//  const [tooltip, setTooltip] = React.useState<{ day: undefined | number; x: number; y: number }>({
//    day: undefined,
//    x: 0,
//    y: 0,
//  });
//
//  const [mousePos, setMousePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
//  const [hasSelection, setHasSelection] = React.useState<boolean>(false);
//  const [isSelecting, setIsSelecting] = React.useState<boolean>(false);
//  const [areaStart, setAreaStart] = React.useState<number>(0);
//  const [areaEnd, setAreaEnd] = React.useState<number>(0);
//  const [tickJiggle, setTickJiggle] = React.useState<number>(0);
//
//  const [windowWidth, __] = useWindowSize();
//
//  const numDays = (vm.endDate.getTime() - vm.startDate.getTime()) / (1000 * 60 * 60 * 24);
//
//  let emphasizeDistance = 7;
//
//  let visualizedDays = numDays;
//  if (visualizedDays > 210) {
//    visualizedDays = numDays / 7;
//    emphasizeDistance = 4;
//  }
//
//  const dayWidth = vm.rulerWidth / numDays;
//
//  const commits = (
//    branch?: ParsedBranch,
//    yOffset = vm.rowHeight / 2,
//    radius = vm.commitSizeTop,
//  ) => {
//    if (!branch) return;
//    return (
//      <Commits
//        startDate={vm.startDate}
//        dayWidth={dayWidth}
//        endDate={vm.endDate}
//        commits={branch.commits}
//        yOffset={yOffset}
//        radius={radius}
//        vm={vm}
//      ></Commits>
//    );
//  };
//
//  const getDayFromCoordinate = (x: number, boundingRect: { width: number; height: number }) => {
//    return (
//      Math.floor(
//        (x - boundingRect.width * (vm.textColumnWidth / vm.viewBox.width)) /
//          ((boundingRect.width * vm.rulerWidth) / vm.viewBox.width / numDays),
//      ) + 1
//    );
//  };
//
//  const handleMouseMove: MouseEventHandler<SVGSVGElement | undefined> = (event) => {
//    if (!event.currentTarget) return;
//
//    const boundingRect = event.currentTarget.getBoundingClientRect();
//    let x = event.clientX - boundingRect.left;
//    const y = event.clientY - boundingRect.top + 25; // hardcoded offset from the top (header height)
//
//    const delta_x = Math.abs(mousePos.x - x);
//    const delta_y = Math.abs(mousePos.y - y);
//    const MIN_MOUSE_MOVE_THRESHOLD_PX = 5; // TODO: Sync threshold to ticks
//
//    if (delta_x < MIN_MOUSE_MOVE_THRESHOLD_PX && delta_y < MIN_MOUSE_MOVE_THRESHOLD_PX) return;
//
//    setMousePos({ x: event.clientX + 200 > windowWidth ? x - 200 : x, y });
//
//    const day = getDayFromCoordinate(x, boundingRect);
//
//    if (
//      x > boundingRect.width * (vm.textColumnWidth / vm.viewBox.width) &&
//      x < boundingRect.width * ((vm.textColumnWidth + vm.rulerWidth) / vm.viewBox.width) &&
//      y > vm.graphs.pos.y &&
//      y < boundingRect.height * (vm.ruler.height / vm.viewBox.height) + vm.graphs.pos.y
//    ) {
//      setTooltip({ day, x, y });
//    } else {
//      setTooltip({ day: undefined, x: 0, y: 0 });
//    }
//
//    event.bubbles = false;
//
//    if (event.buttons === MOUSE_BUTTON_PRIMARY) {
//      x = Math.min(
//        x,
//        boundingRect.width * (vm.textColumnWidth / vm.viewBox.width) +
//          boundingRect.width * (1 - (vm.textColumnWidth + 3 * vm.padding) / vm.viewBox.width),
//      );
//      x = Math.max(x, boundingRect.width * (vm.textColumnWidth / vm.viewBox.width));
//      x = x + tickJiggle;
//
//      if (!isSelecting) {
//        setAreaStart(x);
//        vm.setSelectedStartDate(
//          getDayFromOffset(getDayFromCoordinate(x, boundingRect), vm.startDate),
//        );
//        setHasSelection(true);
//        setIsSelecting(true);
//      }
//      setAreaEnd(x);
//      vm.setSelectedEndDate(getDayFromOffset(getDayFromCoordinate(x, boundingRect), vm.startDate));
//      setTooltip({ day, x, y });
//    } else {
//      if (isSelecting) {
//        setIsSelecting(false);
//      }
//    }
//    if (event.buttons === MOUSE_BUTTON_WHEEL) {
//      const tickSpace = vm.rulerWidth / visualizedDays;
//      let newTickJiggle = tickJiggle + x - mousePos.x;
//
//      newTickJiggle = clamp(newTickJiggle, -tickSpace, tickSpace);
//      let jiggleDays = (newTickJiggle / tickSpace) * -1;
//
//      if (newTickJiggle === -tickSpace || newTickJiggle === tickSpace) {
//        newTickJiggle = 0;
//        jiggleDays = Math.round(jiggleDays);
//        vm.setStartDate(
//          new Date(
//            vm.startDate.getTime() +
//              1000 * 60 * 60 * 24 * jiggleDays * (emphasizeDistance === 4 ? 7 : 1),
//          ),
//        );
//        vm.setEndDate(
//          new Date(
//            vm.endDate.getTime() +
//              1000 * 60 * 60 * 24 * jiggleDays * (emphasizeDistance === 4 ? 7 : 1),
//          ),
//        );
//      }
//      setTickJiggle(newTickJiggle);
//      setTooltip({ day: undefined, x: 0, y: 0 });
//      handleOnClick(_, true);
//
//      //vm.setStartDate(new Date(vm.startDate.getTime() - 1000 * 60 * 24));
//      //vm.setEndDate(new Date(vm.endDate.getTime() - 1000 * 60 * 24));
//    }
//    if (event.buttons !== MOUSE_BUTTON_WHEEL) {
//      setTickJiggle(0);
//    }
//  };
//
//  const handleScroll: React.WheelEventHandler<SVGSVGElement | undefined> = (event) => {
//    const zoomFactor = 0.05;
//    const scrollFactor = 0.05;
//
//    let ticks = 0;
//    const delta = normalizeWheelEventDirection(event);
//    // eslint-disable-next-line unicorn/prefer-ternary
//    if (Math.abs(delta) > 2) {
//      /**
//       * probably a mouse wheel with big delta`s per wheel action
//       * so we can just go 1 full tick per event
//       */
//      ticks = Math.sign(delta);
//    } else {
//      /**
//       * probably something fine-grained, like a trackpad gesture.
//       * We need to accumulate ticks to ensure smooth zooming
//       * */
//      ticks = vm.accumulateWheelTicks(delta * 0.005);
//    }
//
//    const currentRange = vm.endDate.getTime() - vm.startDate.getTime();
//    let newStartDate = vm.startDate.getTime();
//    let newEndDate = vm.endDate.getTime();
//
//    if (event.shiftKey) {
//      // Move timeline
//      newStartDate = vm.startDate.getTime() - currentRange * ticks * scrollFactor;
//      newEndDate = vm.endDate.getTime() - currentRange * ticks * scrollFactor;
//    } else {
//      // Zoom in/out
//      let newRange = currentRange;
//
//      newRange = currentRange * (1 + zoomFactor * -ticks);
//
//      newStartDate = vm.startDate.getTime() + (currentRange - newRange) / 2;
//      newEndDate = vm.endDate.getTime() - (currentRange - newRange) / 2;
//    }
//
//    vm.setStartDate(new Date(newStartDate));
//    vm.setEndDate(new Date(newEndDate));
//    handleOnClick(_, true);
//    setTooltip({ day: undefined, x: 0, y: 0 });
//  };
//
//  const handleOnClick = (_: any, force?: boolean) => {
//    if (force || (hasSelection && !isSelecting)) {
//      setHasSelection(false);
//      setIsSelecting(false);
//      setAreaStart(0);
//      setAreaEnd(0);
//      vm.setSelectedStartDate(vm.startDate);
//      vm.setSelectedEndDate(vm.endDate);
//    }
//  };
//
//  const handleMouseLeave = () => {
//    setTooltip({ day: undefined, x: 0, y: 0 });
//  };
//
//  const svgContainerRef = React.useRef<HTMLDivElement>(null);
//  const [width, _] = useWindowSize();
//
//  React.useLayoutEffect(() => {
//    handleOnClick(_);
//    vm.setViewBoxWidth(svgContainerRef.current?.clientWidth || 1000);
//  }, [
//    svgContainerRef,
//    width,
//    vmController.isRepoPanelVisible,
//    vmController.isSettingsPanelVisible,
//    vm.branches,
//  ]);
//
//  if (!vm.branches || vm.branches.length === 0)
//    return (
//      <div
//        className={style.TimelineContainer}
//        style={{ height: "100px", display: "flex", justifyContent: "center" }}
//      >
//        <Spin size={"large"} />
//      </div>
//    );
//
//  return (
//    <div className={style.TimelineContainer} id={"TimelineContainer"}>
//      <div className={style.TimelineHeader}>
//        <h1 className={style.Header}>Timeline</h1>
//        <Button
//          variant={"filled"}
//          onClick={() => vm.toggleModal()}
//          style={{ width: "80px", marginRight: "1rem" }}
//        >
//          {vm.isModalVisible ? "Close" : "Expand"}
//        </Button>
//      </div>
//
//      <div
//        style={{
//          position: "relative",
//          width: "100%",
//          height: "100%",
//          maxHeight: "200px",
//          minHeight: "150px",
//        }}
//        ref={svgContainerRef}
//      >
//        {vm.isModalVisible && (
//          <div className={style.timelineOverlay}>
//            <div
//              className={style.timelineOverlayContent}
//              onWheel={handleScroll as any}
//              onMouseMove={handleMouseMove as any}
//              onMouseUp={(e) => {
//                if (e.button === MOUSE_BUTTON_WHEEL) {
//                  setTickJiggle(0);
//                  handleOnClick(_, true);
//                }
//              }}
//              style={{ gap: `${vm.laneSpacing}rem` }}
//            >
//              {vm.branches.map(
//                (branch, i) =>
//                  branch.name !== vm.selectedBranch?.name && (
//                    <TimelineGraphSvg
//                      key={i}
//                      vm={vm}
//                      commits={commits(branch, 25, vm.commitSizeModal)}
//                      handleScroll={handleScroll}
//                      handleOnClick={handleOnClick}
//                      branch={branch}
//                    ></TimelineGraphSvg>
//                  ),
//              )}
//            </div>
//          </div>
//        )}
//
//        <svg
//          width={"100%"}
//          height={"100%"}
//          viewBox={`0 0 ${vm.viewBox.width} ${vm.viewBox.height}`}
//          onMouseMove={handleMouseMove}
//          onMouseLeave={handleMouseLeave}
//          onMouseUp={(e) => {
//            if (e.button === MOUSE_BUTTON_WHEEL) {
//              setTickJiggle(0);
//              handleOnClick(_);
//            }
//          }}
//          onWheel={handleScroll}
//          onClick={handleOnClick}
//          className={style.Svg}
//        >
//          <rect
//            x={vm.textColumnWidth - vm.padding}
//            y={vm.graphs.pos.y}
//            width={vm.viewBox.width - vm.textColumnWidth - vm.padding}
//            height={vm.ruler.height}
//            strokeWidth={1}
//            className={style.RectContainer}
//          ></rect>
//          <text
//            x={vm.textColumnWidth}
//            y={vm.ruler.height - vm.padding + vm.graphs.pos.y}
//            className={style.RulerAnnotationLeft}
//          >
//            {getDateString(vm.startDate)}
//          </text>
//          <text
//            x={vm.viewBox.width - 3 * vm.padding}
//            y={vm.ruler.height - vm.padding + vm.graphs.pos.y}
//            className={style.RulerAnnotationRight}
//          >
//            {getDateString(vm.endDate)}
//          </text>
//          <Translate {...vm.ruler.pos}>
//            <RulerTicks
//              x={0}
//              y={vm.graphs.pos.y}
//              width={vm.rulerWidth}
//              amount={visualizedDays}
//              emphasize={vm.ruler.ticks.emphasisOpts}
//              tickSize={vm.ruler.ticks.tickSize}
//              startDate={vm.startDate}
//            />
//          </Translate>
//          <TimelineGraph commits={commits(vm.selectedBranch)} vm={vm} branch={vm.selectedBranch} />
//        </svg>
//
//        {hasSelection && (
//          <>
//            <div
//              style={{
//                position: "absolute",
//                left: `${Math.min(areaStart, areaEnd)}px`,
//                top: `0px`,
//                width: `${Math.abs(areaEnd - areaStart)}px`,
//                height: "100%",
//                zIndex: "150",
//              }}
//              className={style.SelectionBox}
//            ></div>
//            <div
//              style={{
//                position: "absolute",
//                left: `${Math.min(areaStart, areaEnd)}px`,
//                top: `${((vm.ruler.height - 8) / vm.viewBox.height) * 100}%`,
//                height: `${(8 / vm.viewBox.height) * 100}%`,
//                width: `${Math.abs(areaEnd - areaStart) + 1}px`,
//                zIndex: "150",
//              }}
//              className={style.SelectionBoxLine}
//            />
//          </>
//        )}
//
//        {(tooltip.day !== undefined || vm.isCommitTooltipVisible) && (
//          <div
//            style={{
//              position: "absolute",
//              left: `${mousePos.x}px`,
//              top: `${mousePos.y}px`,
//              overflow: "hidden",
//              wordWrap: "break-word",
//              whiteSpace: "break-spaces",
//              maxWidth: "200px",
//              zIndex: "400",
//            }}
//            className={style.Tooltip}
//          >
//            {tooltip.day === undefined
//              ? vm.commitTooltip!.message
//              : getDateString(getDayFromOffset(tooltip.day, vm.startDate))}
//          </div>
//        )}
//      </div>
//    </div>
//  );
//});
//
//type TimelineGraphSvgProps = TimelineGraphProps & {
//  handleScroll: (_: any) => void;
//  handleOnClick: (_: any) => void;
//};
//
//const TimelineGraphSvg = observer(
//  ({ commits, branch, vm, handleScroll, handleOnClick }: TimelineGraphSvgProps) => {
//    return (
//      <svg
//        width={"100%"}
//        height={"100%"}
//        viewBox={`0 0 ${vm.viewBox.width} 50`}
//        onWheel={handleScroll}
//        onClick={handleOnClick}
//        className={style.Svg}
//      >
//        <TimelineGraph commits={commits} vm={vm} height={50} branch={branch} />
//      </svg>
//    );
//  },
//);
//
