import { observer } from "mobx-react-lite";
import React from "react";

import { getDaysBetween } from "./timeline.vm";

export type RulerTicksProps = {
  x: number;
  y: number;
  width: number;
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
};

export const RulerTicks = observer(
  ({ x, y, width, amount, emphasize, tickSize, startDate }: RulerTicksProps) => {
    const ticks: React.ReactElement[] = [];
    const ticksPerSide = Math.floor(amount / 2);
    const tickSpacing = width / amount;

    // Every `emphasize.distance` day from the start of the count is emphasized (01.01.1970)
    const differenceDays = getDaysBetween(new Date("1970-01-01"), startDate);

    // Alternate between one tick on the left and right of the centre-point, as this helps with
    // visual congruency when zooming in and out of the ruler.
    for (let i = 0; i < ticksPerSide; i++) {
      const offset = i * tickSpacing;
      const isEmphasized = Math.round(differenceDays + ticksPerSide - i) % emphasize.distance === 0;

      ticks.push(
        <React.Fragment key={`tickFragment-${i}`}>
          <line
            key={`tick-${i}`}
            x1={x - offset + width / 2}
            y1={y}
            x2={x - offset + width / 2}
            y2={y + (isEmphasized ? emphasize.height : tickSize.height)}
            stroke="var(--foreground-primary)"
            strokeWidth={isEmphasized ? emphasize.width : tickSize.width}
          />
        </React.Fragment>,
      );
    }

    for (let i = 0; i < ticksPerSide; i++) {
      const offset = i * tickSpacing;
      const isEmphasized = Math.round(differenceDays + ticksPerSide + i) % emphasize.distance === 0;

      ticks.push(
        <React.Fragment key={`tickFragment+${i}`}>
          <line
            key={`tick+${i}`}
            x1={x + offset + width / 2}
            y1={y}
            x2={x + offset + width / 2}
            y2={y + (isEmphasized ? emphasize.height : tickSize.height)}
            stroke="var(--foreground-primary)"
            strokeWidth={isEmphasized ? emphasize.width : tickSize.width}
          />
        </React.Fragment>,
      );
    }

    return <React.Fragment>{ticks}</React.Fragment>;
  },
);
