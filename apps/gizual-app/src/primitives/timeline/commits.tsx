import { CInfo } from "@app/types";
import { GizDate } from "@app/utils";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import style from "./timeline.module.scss";
import { TimelineViewModel } from "./timeline.vm";

type CommitsProps = {
  vm: TimelineViewModel;
  commits?: CInfo[];
  selectionStartDate: GizDate;
  selectionEndDate: GizDate;
  radius: number;
};

export const Commits = observer(
  ({ vm, radius, selectionStartDate, selectionEndDate }: CommitsProps) => {
    const commitsToDraw = vm.commitsToDraw;
    if (commitsToDraw.length === 0) return <></>;

    const commitCircles = commitsToDraw.map((commit, i) => {
      return (
        <Commit
          key={`${i}`}
          commits={commit.commits}
          x={commit.x}
          y={commit.y}
          ry={radius}
          rx={commit.rx}
          isHighlighted={new GizDate(commit.interpolatedTimestamp).isBetween(
            selectionStartDate,
            selectionEndDate,
          )}
          isHovered={vm.isHoveringCommitId === i}
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
  isHovered?: boolean;
};

const Commit = observer(
  ({ commits, x, y, rx = 10, ry = 10, isHighlighted = false, isHovered = false }: CommitProps) => {
    const isMergedCommit = commits.length > 1; // If we had to merge commits before, this is a pseudo-commit.

    return (
      <g>
        <ellipse
          cx={x}
          cy={y}
          rx={rx}
          ry={ry}
          className={clsx(
            style.CommitCircle,
            isHighlighted && style.CommitCircleHighlight,
            isHovered && style.CommitCircleHover,
          )}
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
