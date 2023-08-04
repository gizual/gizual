import { BranchInfo, CInfo } from "@app/types";
import { useWindowSize } from "@app/utils";
import { Spin } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React, { MouseEventHandler } from "react";

import { useMainController, useViewModelController } from "../../controllers";
import { Button } from "../button";

import style from "./timeline.module.scss";
import { ParsedBranch, TimelineViewModel } from "./timeline.vm";

export type TimelineProps = {
  vm?: TimelineViewModel;
};

function toDate(timestamp: string) {
  return new Date(Number(timestamp) * 1000);
}

export const Timeline = observer(({ vm: externalVm }: TimelineProps) => {
  const mainController = useMainController();
  const vmController = useViewModelController();

  const vm: TimelineViewModel = React.useMemo(() => {
    return externalVm || new TimelineViewModel(mainController);
  }, [externalVm]);

  const [tooltip, setTooltip] = React.useState<{ day: undefined | number; x: number; y: number }>({
    day: undefined,
    x: 0,
    y: 0,
  });

  const [mousePos, setMousePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasSelection, setHasSelection] = React.useState<boolean>(false);
  const [isSelecting, setIsSelecting] = React.useState<boolean>(false);
  const [areaStart, setAreaStart] = React.useState<number>(0);
  const [areaEnd, setAreaEnd] = React.useState<number>(0);
  const [selectedArea, setSelectedArea] = React.useState<{ start: Date; end: Date }>({
    start: vm.startDate,
    end: vm.endDate,
  });

  const [windowWidth, __] = useWindowSize();

  // GHC magic :()
  const numDays = (vm.endDate.getTime() - vm.startDate.getTime()) / (1000 * 60 * 60 * 24);

  let separatorAt = 5;

  let visualizedDays = numDays;
  if (visualizedDays > 210) {
    visualizedDays = numDays / 7;
    separatorAt = 4;
  }

  const dayWidth = vm.rulerWidth / numDays;

  const tickDays = visualizedDays / 2;
  const tickWidth = vm.rulerWidth / visualizedDays;

  const ticks = Array.from({ length: tickDays }, (_, i) => (
    <React.Fragment key={i}>
      <line
        key={`-${i}`}
        x1={i * tickWidth + vm.rulerWidth / 2}
        y1={0}
        x2={i * tickWidth + vm.rulerWidth / 2}
        y2={i % separatorAt === 0 ? vm.largeTickHeight : vm.smallTickHeight}
        stroke="var(--foreground-primary)"
        strokeWidth="1"
      />
      <line
        key={`+${i}`}
        x1={-i * tickWidth + vm.rulerWidth / 2}
        y1={0}
        x2={-i * tickWidth + vm.rulerWidth / 2}
        y2={i % separatorAt === 0 ? vm.largeTickHeight : vm.smallTickHeight}
        stroke="var(--foreground-primary)"
        strokeWidth="1"
      />
    </React.Fragment>
  ));

  const commits = (
    branch?: ParsedBranch,
    yOffset = vm.rowHeight / 2,
    radius = vm.commitSizeTop,
  ) => {
    if (!branch) return;
    return (
      <Commits
        startDate={vm.startDate}
        dayWidth={dayWidth}
        endDate={vm.endDate}
        commits={branch.commits}
        yOffset={yOffset}
        radius={radius}
        vm={vm}
      ></Commits>
    );
  };

  const getDayFromCoordinate = (x: number, boundingRect: { width: number; height: number }) => {
    return (
      Math.floor(
        (x - boundingRect.width * (vm.leftColWidth / vm.viewBox.width)) /
          ((boundingRect.width * vm.rulerWidth) / vm.viewBox.width / numDays),
      ) + 1
    );
  };

  const handleMouseMove: MouseEventHandler<SVGSVGElement | undefined> = (event) => {
    if (!event.currentTarget) return;

    const boundingRect = event.currentTarget.getBoundingClientRect();
    let x = event.clientX - boundingRect.left;
    const y = event.clientY - boundingRect.top + 25; // hardcoded offset from the top (header height)

    setMousePos({ x: event.clientX + 200 > windowWidth ? x - 200 : x, y });

    const day = getDayFromCoordinate(x, boundingRect);

    if (
      x > boundingRect.width * (vm.leftColWidth / vm.viewBox.width) &&
      x < boundingRect.width * ((vm.leftColWidth + vm.rulerWidth) / vm.viewBox.width) &&
      y > 0 &&
      y < boundingRect.height * (vm.rulerHeight / vm.viewBox.height)
    ) {
      setTooltip({ day, x, y });
    } else {
      setTooltip({ day: undefined, x: 0, y: 0 });
    }

    event.bubbles = false;

    if (event.buttons === 1) {
      x = Math.min(
        x,
        boundingRect.width * (vm.leftColWidth / vm.viewBox.width) +
          boundingRect.width * (1 - (vm.leftColWidth + 3 * vm.padding) / vm.viewBox.width),
      );
      x = Math.max(x, boundingRect.width * (vm.leftColWidth / vm.viewBox.width));

      if (!isSelecting) {
        setAreaStart(x);
        setSelectedArea({
          ...selectedArea,
          start: getDayFromOffset(getDayFromCoordinate(x, boundingRect), vm.startDate),
        });
        setHasSelection(true);
        setIsSelecting(true);
      }
      setAreaEnd(x);
      setSelectedArea({
        ...selectedArea,
        end: getDayFromOffset(getDayFromCoordinate(x, boundingRect), vm.startDate),
      });
      setTooltip({ day, x, y });
    } else {
      if (isSelecting) {
        setIsSelecting(false);
      }
    }
  };

  const handleScroll: React.WheelEventHandler<SVGSVGElement | undefined> = (event) => {
    let zoomFactor = 0.05;
    let scrollFactor = 0.05;

    if (event.deltaMode === 0) {
      // likely a touchpad
      zoomFactor = 0.01;
      scrollFactor = 0.01;
    }

    const currentRange = vm.endDate.getTime() - vm.startDate.getTime();
    let newStartDate = vm.startDate.getTime();
    let newEndDate = vm.endDate.getTime();

    if (event.shiftKey) {
      // Move timeline
      if (event.deltaX < 0) {
        newStartDate = vm.startDate.getTime() + currentRange * scrollFactor;
        newEndDate = vm.endDate.getTime() + currentRange * scrollFactor;
      } else {
        newStartDate = vm.startDate.getTime() - currentRange * scrollFactor;
        newEndDate = vm.endDate.getTime() - currentRange * scrollFactor;
      }
    } else {
      // Zoom in/out
      let newRange = currentRange;

      // eslint-disable-next-line unicorn/prefer-ternary
      if (event.deltaY < 0) {
        // Zoom in
        newRange = currentRange * (1 - zoomFactor);
      } else {
        // Zoom out
        newRange = currentRange * (1 + zoomFactor);
      }
      newStartDate = vm.startDate.getTime() + (currentRange - newRange) / 2;
      newEndDate = vm.endDate.getTime() - (currentRange - newRange) / 2;
    }

    vm.setStartDate(new Date(newStartDate));
    vm.setEndDate(new Date(newEndDate));
    setTooltip({ day: undefined, x: 0, y: 0 });
  };

  const handleOnClick = (_: any) => {
    if (hasSelection && !isSelecting) {
      setHasSelection(false);
      setIsSelecting(false);
      setAreaStart(0);
      setAreaEnd(0);
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ day: undefined, x: 0, y: 0 });
  };

  const svgContainerRef = React.useRef<HTMLDivElement>(null);
  const [width, _] = useWindowSize();

  React.useLayoutEffect(() => {
    handleOnClick(_);
    vm.setViewBoxWidth(svgContainerRef.current?.clientWidth || 1000);
  }, [
    svgContainerRef,
    width,
    vmController.isRepoPanelVisible,
    vmController.isSettingsPanelVisible,
    vm.branches,
  ]);

  if (!vm.branches || vm.branches.length === 0)
    return (
      <div
        className={style.TimelineContainer}
        style={{ height: "100px", display: "flex", justifyContent: "center" }}
      >
        <Spin size={"large"} />
      </div>
    );

  return (
    <div className={style.TimelineContainer} id={"TimelineContainer"}>
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

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          maxHeight: "200px",
          minHeight: "150px",
        }}
        ref={svgContainerRef}
      >
        {vm.isModalVisible && (
          <div className={style.timelineOverlay}>
            <div
              className={style.timelineOverlayContent}
              onWheel={handleScroll as any}
              onMouseMove={handleMouseMove as any}
              style={{ gap: `${vm.laneSpacing}rem` }}
            >
              {vm.branches.map((branch, i) => (
                <TimelineGraphSvg
                  key={i}
                  vm={vm}
                  commits={commits(branch, 25, vm.commitSizeModal)}
                  handleScroll={handleScroll}
                  handleOnClick={handleOnClick}
                  branch={branch}
                ></TimelineGraphSvg>
              ))}
            </div>
          </div>
        )}

        <svg
          width={"100%"}
          height={"100%"}
          viewBox={`0 0 ${vm.viewBox.width} ${vm.viewBox.height}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onWheel={handleScroll}
          onClick={handleOnClick}
          className={style.Svg}
        >
          <rect
            x={vm.leftColWidth - vm.padding}
            y={0}
            width={vm.viewBox.width - vm.leftColWidth - vm.padding}
            height={vm.rulerHeight}
            strokeWidth={1}
            className={style.RectContainer}
          ></rect>
          <text
            x={vm.leftColWidth}
            y={vm.rulerHeight - vm.padding}
            className={style.RulerAnnotationLeft}
          >
            {getDateString(vm.startDate)}
          </text>
          <text
            x={vm.viewBox.width - 3 * vm.padding}
            y={vm.rulerHeight - vm.padding}
            className={style.RulerAnnotationRight}
          >
            {getDateString(vm.endDate)}
          </text>
          <Translate {...vm.ruler.pos}>{ticks}</Translate>
          <TimelineGraph
            commits={commits(vm.selectedBranch)}
            vm={vm}
            branch={vm.selectedBranch}
            isBelowRuler
          />
        </svg>

        {hasSelection && (
          <>
            <div
              style={{
                position: "absolute",
                left: `${Math.min(areaStart, areaEnd)}px`,
                top: `0px`,
                width: `${Math.abs(areaEnd - areaStart)}px`,
                height: "100%",
                zIndex: "150",
              }}
              className={style.SelectionBox}
            ></div>
            <div
              style={{
                position: "absolute",
                left: `${Math.min(areaStart, areaEnd)}px`,
                top: `${((vm.rulerHeight - 8) / vm.viewBox.height) * 100}%`,
                height: `${(8 / vm.viewBox.height) * 100}%`,
                width: `${Math.abs(areaEnd - areaStart) + 1}px`,
                zIndex: "150",
              }}
              className={style.SelectionBoxLine}
            />
          </>
        )}

        {(tooltip.day !== undefined || vm.isCommitTooltipVisible) && (
          <div
            style={{
              position: "absolute",
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              overflow: "hidden",
              wordWrap: "break-word",
              whiteSpace: "break-spaces",
              maxWidth: "200px",
              zIndex: "400",
            }}
            className={style.Tooltip}
          >
            {tooltip.day === undefined
              ? vm.commitTooltip!.message
              : getDateString(getDayFromOffset(tooltip.day, vm.startDate))}
          </div>
        )}
      </div>
    </div>
  );
});

type TimelineGraphProps = {
  vm: TimelineViewModel;
  commits?: React.ReactElement;
  branch?: BranchInfo;
  isBelowRuler?: boolean;
  height?: number;
};

const TimelineGraph = observer(
  ({ commits, branch, vm, isBelowRuler, height }: TimelineGraphProps) => {
    if (!commits || !branch) return <></>;
    const offset = isBelowRuler ? vm.graphs.pos : { x: 0, y: 0 };
    if (!height) height = vm.rowHeight;
    return (
      <Translate {...offset}>
        <foreignObject
          x={vm.padding}
          y={0}
          width={vm.leftColWidth - 2 * vm.padding}
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
          x={vm.leftColWidth - vm.padding}
          y={0}
          width={vm.viewBox.width - vm.leftColWidth - vm.padding}
          height={height}
          strokeWidth={1}
          className={style.RectContainer}
        ></rect>
        <Translate x={vm.leftColWidth - vm.padding} y={0}>
          <line
            x1={0}
            x2={vm.viewBox.width - vm.leftColWidth - vm.padding}
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

type TimelineGraphSvgProps = TimelineGraphProps & {
  handleScroll: (_: any) => void;
  handleOnClick: (_: any) => void;
};

const TimelineGraphSvg = observer(
  ({ commits, branch, vm, handleScroll, handleOnClick }: TimelineGraphSvgProps) => {
    return (
      <svg
        width={"100%"}
        height={"100%"}
        viewBox={`0 0 ${vm.viewBox.width} 50`}
        onWheel={handleScroll}
        onClick={handleOnClick}
        className={style.Svg}
      >
        <TimelineGraph commits={commits} vm={vm} height={50} branch={branch} />
      </svg>
    );
  },
);

type CommitProps = {
  commit: CommitData;
  vm: TimelineViewModel;
  x: number;
  y: number;
  r?: number;
  isHighlighted?: boolean;
};

type CommitData = CInfo & {};

function Commit({ commit, x, y, r = 10, vm, isHighlighted = false }: CommitProps) {
  const [hover, setHover] = React.useState(false);

  return (
    <>
      <circle
        cx={x}
        cy={y}
        r={r}
        className={clsx(
          style.CommitCircle,
          hover && style.CommitCircleHover,
          isHighlighted && style.CommitCircleHover,
        )}
        onMouseEnter={() => {
          setHover(true);
          vm.showTooltip(commit);
        }}
        onMouseLeave={() => {
          setHover(false);
          vm.hideTooltip();
        }}
      />
      {/*commit.parents[1] !== null && (
        <line x1={x} x2={x - r * 2} y1={y} y2={y + r * 2} stroke={"yellow"} strokeWidth={2} />
      )}
      {commit.children[1] !== null && (
        <line x1={x} x2={x + r * 2} y1={y} y2={y + r * 2} stroke={"yellow"} strokeWidth={2} />
      )*/}
    </>
  );
}

type CommitsProps = {
  commits?: CommitData[];
  vm: TimelineViewModel;
  startDate: Date;
  endDate: Date;
  dayWidth: number;
  yOffset: number;
  radius?: number;
};

function Commits({ commits, vm, startDate, endDate, dayWidth, yOffset, radius }: CommitsProps) {
  if (!commits) return <></>;
  const commitCircles = commits.map((commit, i) => {
    const commitDay =
      (toDate(commit.timestamp).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (
      toDate(commit.timestamp).getTime() < startDate.getTime() ||
      toDate(commit.timestamp).getTime() > endDate.getTime()
    )
      return <React.Fragment key={i}></React.Fragment>;
    return (
      <Commit commit={commit} key={i} x={commitDay * dayWidth} y={yOffset} r={radius} vm={vm} />
    );
  });

  return <>{commitCircles}</>;
}

function getDayFromOffset(offset: number, startDate: Date) {
  return new Date(startDate.getTime() + offset * 1000 * 60 * 60 * 24);
}

function getDateString(date: Date) {
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

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
