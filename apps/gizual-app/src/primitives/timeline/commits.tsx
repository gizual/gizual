import { CInfo } from "@app/types";
import clsx from "clsx";
import React from "react";

import style from "./timeline.module.scss";
import { getDateFromTimestamp, getDaysBetween, TimelineViewModel } from "./timeline.vm";

type CommitsProps = {
  vm: TimelineViewModel;
  commits?: CInfo[];
  startDate: Date;
  endDate: Date;
  selectionStartDate: Date;
  selectionEndDate: Date;
  dayWidth: number;
  yOffset: number;
  radius?: number;
};

export function Commits({
  vm,
  commits,
  startDate,
  endDate,
  selectionStartDate,
  selectionEndDate,
  dayWidth,
  yOffset,
  radius,
}: CommitsProps) {
  if (!commits) return <></>;

  const commitsInRange = commits.filter(
    (c) =>
      getDateFromTimestamp(c.timestamp) > startDate && getDateFromTimestamp(c.timestamp) < endDate,
  );

  const commitCircles = commitsInRange.map((commit, i) => {
    const commitDate = getDateFromTimestamp(commit.timestamp);
    const dateOffsetFromStart = getDaysBetween(commitDate, startDate);

    const isWithinSelection = selectionStartDate < commitDate && commitDate < selectionEndDate;

    return (
      <Commit
        commit={commit}
        key={i}
        x={dateOffsetFromStart * dayWidth}
        y={yOffset}
        r={radius}
        vm={vm}
        isHighlighted={isWithinSelection}
      />
    );
  });

  return <>{commitCircles}</>;
}

type CommitProps = {
  commit: CInfo;
  vm: TimelineViewModel;
  x: number;
  y: number;
  r?: number;
  isHighlighted?: boolean;
};

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
          isHighlighted && style.CommitCircleHighlight,
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
    </>
  );
}
