import clsx from "clsx";
import React, { MouseEventHandler } from "react";

import { useMainController } from "../../controllers";

import style from "./timeline.module.scss";
import { TimelineViewModel } from "./timeline.vm";

export type TimelineProps = {
  vm?: TimelineViewModel;
};

export function Timeline({ vm: externalVm }: TimelineProps) {
  const mainController = useMainController();

  const vm: TimelineViewModel = React.useMemo(() => {
    return externalVm || new TimelineViewModel(mainController);
  }, [externalVm]);

  const [tooltip, setTooltip] = React.useState<{ day: undefined | number; x: number; y: number }>({
    day: undefined,
    x: 0,
    y: 0,
  });

  const numRows = 1;
  const [startDate, setStartDate] = React.useState(new Date("2020-01-01"));
  const [endDate, setEndDate] = React.useState(new Date("2020-06-01"));

  // GHC magic :()
  const numDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  const [hasSelection, setHasSelection] = React.useState<boolean>(false);
  const [isSelecting, setIsSelecting] = React.useState<boolean>(false);
  const [areaStart, setAreaStart] = React.useState<number>(0);
  const [areaEnd, setAreaEnd] = React.useState<number>(0);
  const [selectedArea, setSelectedArea] = React.useState<{ start: Date; end: Date }>({
    start: startDate,
    end: endDate,
  });

  const viewBox = {
    width: 1000,
    height: 200,
  };

  const leftColWidth = 120;
  const rulerHeight = 80;
  const rowHeight = 80;
  const padding = 20;
  const rulerWidth = viewBox.width - leftColWidth - 3 * padding;
  const smallTickHeight = 10;
  const largeTickHeight = 20;
  const dayWidth = rulerWidth / numDays;

  const ruler = {
    pos: {
      x: leftColWidth,
      y: padding,
    },
  };

  const graphs = {
    pos: {
      x: 0,
      y: rulerHeight + padding * 2,
    },
  };

  const ticks = Array.from({ length: numDays }, (_, i) => (
    <line
      key={i}
      x1={i * dayWidth}
      y1={0}
      x2={i * dayWidth}
      y2={i % 5 === 0 ? largeTickHeight : smallTickHeight}
      stroke="white"
      strokeWidth="1"
    />
  ));

  const mockCommits = [
    new Date("2020-01-01"),
    new Date("2020-02-01"),
    new Date("2020-03-01"),
    new Date("2020-04-15"),
    new Date("2020-05-10"),
    new Date("2020-06-01"),
  ];

  const commitCircles = mockCommits.map((commit, i) => {
    const commitDay = (commit.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (commit.getTime() < startDate.getTime() || commit.getTime() > endDate.getTime()) return;
    return <Commit commit={{ date: commit }} key={i} x={commitDay * dayWidth} y={rowHeight / 2} />;
  });

  const getDayFromCoordinate = (x: number, boundingRect: { width: number; height: number }) => {
    return (
      Math.floor(
        (x - boundingRect.width * (leftColWidth / 1000)) /
          ((boundingRect.width * rulerWidth) / 1000 / numDays)
      ) + 1
    );
  };

  const handleMouseMove: MouseEventHandler<SVGSVGElement | undefined> = (event) => {
    if (!event.currentTarget) return;

    const boundingRect = event.currentTarget.getBoundingClientRect();
    let x = event.clientX - boundingRect.left;
    const y = event.clientY - boundingRect.top + 25; // hardcoded offset from the top (header height)

    const day = getDayFromCoordinate(x, boundingRect);

    if (
      x > boundingRect.width * (leftColWidth / 1000) &&
      x < boundingRect.width * ((leftColWidth + rulerWidth) / 1000) &&
      y > 0 &&
      y < boundingRect.height * (rulerHeight / viewBox.height)
    ) {
      setTooltip({ day, x, y });
    } else {
      setTooltip({ day: undefined, x: 0, y: 0 });
    }

    event.bubbles = false;

    if (event.buttons === 1) {
      x = Math.min(
        x,
        boundingRect.width * (leftColWidth / 1000) +
          boundingRect.width * (1 - (leftColWidth + 3 * padding) / 1000)
      );
      x = Math.max(x, boundingRect.width * (leftColWidth / 1000));

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
    const zoomFactor = 0.05;
    const scrollFactor = 0.05;

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

  const handleOnClick = (event) => {
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

  return (
    <div className={style.TimelineContainer} id={"TimelineContainer"}>
      <div className={style.TimelineHeader}>
        <h1 className={style.Header}>Timeline</h1>
      </div>

      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <svg
          width={"100%"}
          height={"100%"}
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onWheel={handleScroll}
          onClick={handleOnClick}
          className={style.Svg}
        >
          <rect
            x={leftColWidth - padding}
            y={0}
            width={viewBox.width - leftColWidth - padding}
            height={rulerHeight}
            strokeWidth={1}
            className={style.RectContainer}
          ></rect>
          <text x={leftColWidth} y={rulerHeight - padding} className={style.RulerAnnotationLeft}>
            {getDateString(startDate)}
          </text>
          <text
            x={viewBox.width - 3 * padding}
            y={rulerHeight - padding}
            className={style.RulerAnnotationRight}
          >
            {getDateString(endDate)}
          </text>
          <Translate {...ruler.pos}>{ticks}</Translate>
          <Translate {...graphs.pos}>
            <text x={padding} y={rowHeight / 2} className={style.BranchName}>
              master
            </text>
            <rect
              x={leftColWidth - padding}
              y={0}
              width={viewBox.width - leftColWidth - padding}
              height={rowHeight}
              strokeWidth={1}
              className={style.RectContainer}
            ></rect>
            <Translate x={leftColWidth - padding} y={0}>
              <line
                x1={0}
                x2={viewBox.width - leftColWidth - padding}
                y1={rowHeight / 2}
                y2={rowHeight / 2}
                stroke={"white"}
                strokeWidth={4}
              />

              <Translate x={padding} y={0}>
                {commitCircles}
              </Translate>
            </Translate>
          </Translate>
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
              }}
              className={style.SelectionBox}
            ></div>
            <div
              style={{
                position: "absolute",
                left: `${Math.min(areaStart, areaEnd)}px`,
                top: `${((rulerHeight - 8) / viewBox.height) * 100}%`,
                height: `${(8 / viewBox.height) * 100}%`,
                width: `${Math.abs(areaEnd - areaStart) + 1}px`,
              }}
              className={style.SelectionBoxLine}
            />
          </>
        )}

        {tooltip.day !== undefined && (
          <div
            style={{
              position: "absolute",
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
            }}
            className={style.Tooltip}
          >
            {getDateString(getDayFromOffset(tooltip.day, startDate))}
          </div>
        )}
      </div>
    </div>
  );
}

type CommitProps = {
  commit: CommitData;
  x: number;
  y: number;
  r?: number;
  isHighlighted?: boolean;
};

type CommitData = {
  date: Date;
};

function Commit({ x, y, r = 10, isHighlighted = false }: CommitProps) {
  const [hover, setHover] = React.useState(false);

  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      className={clsx(
        style.CommitCircle,
        hover && style.CommitCircleHover,
        isHighlighted && style.CommitCircleHover
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    />
  );
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
  children: React.ReactNode[];
}) {
  return <g transform={`translate(${x},${y})`}>{children}</g>;
}
