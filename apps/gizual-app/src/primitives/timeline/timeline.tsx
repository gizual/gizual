import { BranchInfo, CInfo } from "@app/types";
import { useWindowSize } from "@app/utils";
import { InputNumber } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React, { MouseEventHandler } from "react";

import { useMainController } from "../../controllers";
import { Button } from "../button";

import data from "./mock.json";
import style from "./timeline.module.scss";
import { TimelineViewModel } from "./timeline.vm";

export type TimelineProps = {
  vm?: TimelineViewModel;
};

function toDate(timestamp: string) {
  return new Date(Number(timestamp) * 1000);
}

const commitIndices = new Map<string, number>(Object.entries(data.commit_indices));

function getCommitsForBranch(branch: BranchInfo) {
  const parsedCommits: CInfo[] = [];
  const origin = branch.last_commit_id;
  const originIndex = commitIndices.get(origin);

  if (!originIndex) throw new Error(`Could not find commit index for commit ${origin}`);

  const commit = data.commits[originIndex];
  //console.log("getCommitsForBranch", commit);
  parsedCommits.push(commit as any);

  let currentCommit = commit;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!currentCommit.parents) break;

    const parents = Object.entries(currentCommit.parents);

    const parentId = parents[0][1];
    //console.log("getCommitsForBranch", parentId);

    if (parents.length === 0) break;
    currentCommit = data.commits[commitIndices.get(parentId!) as any];
    if (!currentCommit) break;

    parsedCommits.push(currentCommit as any);
  }

  return parsedCommits;
}

type ParsedBranch = BranchInfo & { commits: CInfo[] };

function prepareBranches() {
  return data.branches.map((branch) => {
    return {
      ...branch,
      commits: getCommitsForBranch(branch),
    };
  });
}

export const Timeline = observer(({ vm: externalVm }: TimelineProps) => {
  const mainController = useMainController();

  const vm: TimelineViewModel = React.useMemo(() => {
    return externalVm || new TimelineViewModel(mainController);
  }, [externalVm]);

  const [tooltip, setTooltip] = React.useState<{ day: undefined | number; x: number; y: number }>({
    day: undefined,
    x: 0,
    y: 0,
  });

  const [mousePos, setMousePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const branches = React.useMemo(() => prepareBranches(), []);

  const [startDate, setStartDate] = React.useState(new Date("2023-04-15"));
  const [endDate, setEndDate] = React.useState(new Date("2023-07-15"));

  const [hasSelection, setHasSelection] = React.useState<boolean>(false);
  const [isSelecting, setIsSelecting] = React.useState<boolean>(false);
  const [areaStart, setAreaStart] = React.useState<number>(0);
  const [areaEnd, setAreaEnd] = React.useState<number>(0);
  const [selectedArea, setSelectedArea] = React.useState<{ start: Date; end: Date }>({
    start: startDate,
    end: endDate,
  });

  const [windowWidth, __] = useWindowSize();

  // GHC magic :()
  const numDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  const dayWidth = vm.rulerWidth / numDays;

  let tickDays = numDays;
  while (tickDays > 100) {
    tickDays = Math.round(tickDays / 1.5);
  }
  const tickWidth = vm.rulerWidth / tickDays;

  const ticks = Array.from({ length: tickDays }, (_, i) => (
    <line
      key={i}
      x1={i * tickWidth}
      y1={0}
      x2={i * tickWidth}
      y2={i % 5 === 0 ? vm.largeTickHeight : vm.smallTickHeight}
      stroke="var(--foreground-primary)"
      strokeWidth="1"
    />
  ));

  const commits = (branch: ParsedBranch, yOffset = vm.rowHeight / 2, radius = vm.commitSizeTop) => {
    return (
      <Commits
        startDate={startDate}
        dayWidth={dayWidth}
        endDate={endDate}
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
          ((boundingRect.width * vm.rulerWidth) / vm.viewBox.width / numDays)
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
          boundingRect.width * (1 - (vm.leftColWidth + 3 * vm.padding) / vm.viewBox.width)
      );
      x = Math.max(x, boundingRect.width * (vm.leftColWidth / vm.viewBox.width));

      if (!isSelecting) {
        setAreaStart(x);
        setSelectedArea({
          ...selectedArea,
          start: getDayFromOffset(getDayFromCoordinate(x, boundingRect), startDate),
        });
        setHasSelection(true);
        setIsSelecting(true);
      }
      setAreaEnd(x);
      setSelectedArea({
        ...selectedArea,
        end: getDayFromOffset(getDayFromCoordinate(x, boundingRect), startDate),
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
      zoomFactor = 0.005;
      scrollFactor = 0.005;
    }

    const currentRange = endDate.getTime() - startDate.getTime();
    let newStartDate = startDate.getTime();
    let newEndDate = endDate.getTime();

    if (event.shiftKey) {
      // Move timeline
      if (event.deltaX < 0) {
        newStartDate = startDate.getTime() + currentRange * scrollFactor;
        newEndDate = endDate.getTime() + currentRange * scrollFactor;
      } else {
        newStartDate = startDate.getTime() - currentRange * scrollFactor;
        newEndDate = endDate.getTime() - currentRange * scrollFactor;
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
      newStartDate = startDate.getTime() + (currentRange - newRange) / 2;
      newEndDate = endDate.getTime() - (currentRange - newRange) / 2;
    }

    setStartDate(new Date(newStartDate));
    setEndDate(new Date(newEndDate));
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
    vm.setViewBoxWidth(svgContainerRef.current?.clientWidth || 0);
  }, [
    svgContainerRef,
    width,
    vm.mainController.isRepoPanelVisible,
    vm.mainController.isSettingsPanelVisible,
  ]);

  return (
    <div className={style.TimelineContainer} id={"TimelineContainer"}>
      <div className={style.TimelineHeader}>
        <h1 className={style.Header}>Timeline</h1>
        <Button variant={"filled"} onClick={() => vm.toggleModal()} style={{ width: "80px" }}>
          {vm.isModalVisible ? "Close" : "Expand"}
        </Button>
        <div>
          <p style={{ fontSize: "0.75rem", lineHeight: "0.75rem" }}>Spacing</p>
          <InputNumber
            placeholder={"Spacing"}
            value={vm.laneSpacing}
            onChange={(v) => vm.setSpacing(v)}
            style={{ width: "50px" }}
            size={"small"}
          />
        </div>

        <div>
          <p style={{ fontSize: "0.75rem", lineHeight: "0.75rem" }}>CSizeT</p>
          <InputNumber
            placeholder={"Commit Size Top"}
            value={vm.commitSizeTop}
            onChange={(v) => vm.setCommitSizeTop(v)}
            style={{ width: "50px" }}
            size={"small"}
          />
        </div>

        <div>
          <p style={{ fontSize: "0.75rem", lineHeight: "0.75rem" }}>CSizeM</p>
          <InputNumber
            placeholder={"Commit Size Modal"}
            value={vm.commitSizeModal}
            onChange={(v) => vm.setCommitSizeModal(v)}
            style={{ width: "50px" }}
            size={"small"}
          />
        </div>
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
              {branches.map((branch, i) => (
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
            {getDateString(startDate)}
          </text>
          <text
            x={vm.viewBox.width - 3 * vm.padding}
            y={vm.rulerHeight - vm.padding}
            className={style.RulerAnnotationRight}
          >
            {getDateString(endDate)}
          </text>
          <Translate {...vm.ruler.pos}>{ticks}</Translate>
          <TimelineGraph commits={commits(branches[0])} vm={vm} branch={branches[0]} isBelowRuler />
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
              : getDateString(getDayFromOffset(tooltip.day, startDate))}
          </div>
        )}
      </div>
    </div>
  );
});

type TimelineGraphProps = {
  vm: TimelineViewModel;
  commits: React.ReactElement;
  branch: BranchInfo;
  isBelowRuler?: boolean;
  height?: number;
};

const TimelineGraph = observer(
  ({ commits, branch, vm, isBelowRuler, height }: TimelineGraphProps) => {
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
  }
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
  }
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
          isHighlighted && style.CommitCircleHover
        )}
        onMouseEnter={() => {
          setHover(true);
          vm.showTooltip(commit, x, y);
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
  commits: CommitData[];
  vm: TimelineViewModel;
  startDate: Date;
  endDate: Date;
  dayWidth: number;
  yOffset: number;
  radius?: number;
};

function Commits({ commits, vm, startDate, endDate, dayWidth, yOffset, radius }: CommitsProps) {
  const commitCircles = commits.map((commit, i) => {
    const commitDay =
      (toDate(commit.timestamp).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (
      toDate(commit.timestamp).getTime() < startDate.getTime() ||
      toDate(commit.timestamp).getTime() > endDate.getTime()
    )
      return <></>;
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
