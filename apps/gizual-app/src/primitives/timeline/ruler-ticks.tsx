import React from "react";

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
};

export function RulerTicks({ x, y, width, amount, emphasize, tickSize }: RulerTicksProps) {
  const ticks: React.ReactElement[] = [];
  const tickSpacing = width / amount;

  // Alternate between one tick on the left and right of the centre-point, as this helps with
  // visual congruency when zooming in and out of the ruler.
  for (let i = 0; i < amount / 2; i++) {
    const isEmphasized = i % emphasize.distance === 0;
    const offset = i * tickSpacing;

    ticks.push(
      <React.Fragment key={i}>
        <line
          key={`tick-${i}`}
          x1={x + offset + width / 2}
          y1={y}
          x2={x + offset + width / 2}
          y2={y + (isEmphasized ? emphasize.height : tickSize.height)}
          stroke="var(--foreground-primary)"
          strokeWidth={isEmphasized ? emphasize.width : tickSize.width}
        />
        <line
          key={`tick+${i}`}
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

  return <React.Fragment>{ticks}</React.Fragment>;
}
