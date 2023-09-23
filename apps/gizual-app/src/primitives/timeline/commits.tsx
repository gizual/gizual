import { CInfo } from "@app/types";
import { convertTimestampToMs, getDateFromTimestamp, getDaysBetweenAbs, GizDate } from "@app/utils";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import style from "./timeline.module.scss";
import { TimelineViewModel } from "./timeline.vm";

type CommitsProps = {
  vm: TimelineViewModel;
  commits?: CInfo[];
  startDate: GizDate;
  endDate: GizDate;
  selectionStartDate: GizDate;
  selectionEndDate: GizDate;
  dayWidth: number;
  yOffset: number;
  radius: number;
};

export const Commits = observer(
  ({
    commits,
    startDate,
    endDate,
    dayWidth,
    yOffset,
    radius,
    selectionStartDate,
    selectionEndDate,
  }: CommitsProps) => {
    if (!commits) return <></>;

    const commitsInRange = commits.filter(
      (c) =>
        getDateFromTimestamp(c.timestamp) > startDate &&
        getDateFromTimestamp(c.timestamp) < endDate,
    );

    // Check if some commits should be merge together because they would otherwise be obstructing
    // each-other.
    const commitsToDraw: {
      commits: CInfo[];
      x: number;
      y: number;
      rx: number;
      originalPosition: number;
      interpolatedTimestamp: number;
    }[] = [];
    for (const commit of commitsInRange) {
      const commitDate = getDateFromTimestamp(commit.timestamp);
      const dateOffsetFromStart = getDaysBetweenAbs(commitDate, startDate);
      const commitPos = dateOffsetFromStart * dayWidth;

      // Compare this commit with the last one in `commitsToDraw` and see if we need to merge them.
      const previousCommits = commitsToDraw.at(-1);
      if (!previousCommits) {
        commitsToDraw.push({
          x: commitPos,
          y: yOffset,
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
          y: yOffset,
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
        y: yOffset,
        commits: [commit],
        rx: radius,
        originalPosition: commitPos,
        interpolatedTimestamp: convertTimestampToMs(commit.timestamp),
      });
    }

    const commitCircles = commitsToDraw.map((commit, i) => {
      return (
        <Commit
          key={i}
          commits={commit.commits}
          x={commit.x}
          y={commit.y}
          ry={radius}
          rx={commit.rx}
          isHighlighted={new GizDate(commit.interpolatedTimestamp).isBetween(
            selectionStartDate,
            selectionEndDate,
          )}
        />
      );
    });

    return <>{commitCircles}</>;
  },
);

type CommitProps = {
  commits: CInfo[];
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  isHighlighted?: boolean;
};

const Commit = observer(
  ({ commits, x, y, rx = 10, ry = 10, isHighlighted = false }: CommitProps) => {
    const isMergedCommit = commits.length > 1; // If we had to merge commits before, this is a pseudo-commit.

    return (
      <g>
        <ellipse
          cx={x}
          cy={y}
          rx={rx}
          ry={ry}
          className={clsx(style.CommitCircle, isHighlighted && style.CommitCircleHighlight)}
        />
        {isMergedCommit && (
          <text x={x} y={y + ry / 2} className={style.CommitCircleText}>
            {commits.length}
          </text>
        )}
      </g>
    );
  },
);
