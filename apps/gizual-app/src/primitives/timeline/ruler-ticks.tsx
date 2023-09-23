import { getDaysBetweenAbs } from "@app/utils";
import { observer } from "mobx-react-lite";
import React from "react";

export type RulerTicksProps = {
  x: number;
  y: number;
  amount: number;
  tickSize: {
    width: number;
    height: number;
  };
  emphasize: {
    distance: number;
    width: number;
    height: number;
  };
  startDate: Date;
  dayWidth: number;
};

export const RulerTicks = observer(
  ({ x, y, amount, emphasize, tickSize, startDate, dayWidth }: RulerTicksProps) => {
    const ticks: React.ReactElement[] = [];

    // Every `emphasize.distance` day from the start of the count is emphasized (01.01.1970)
    const differenceDays = getDaysBetweenAbs(new Date("1970-01-01"), startDate);

    // This offset is added because all ticks are always placed at the 00:00 mark.
    const offsetToMidnight = differenceDays - Math.floor(differenceDays);

    for (let i = -offsetToMidnight; i < amount + offsetToMidnight; i++) {
      const offset = i * dayWidth;
      const isEmphasized = Math.round(differenceDays + i) % emphasize.distance === 0;

      ticks.push(
        <line
          key={`tick-${i}`}
          x1={x + offset}
          y1={y}
          x2={x + offset}
          y2={y + (isEmphasized ? emphasize.height : tickSize.height)}
          stroke="var(--foreground-primary)"
          strokeWidth={isEmphasized ? emphasize.width : tickSize.width}
        />,
      );
    }
    return <React.Fragment>{ticks}</React.Fragment>;
  },
);
