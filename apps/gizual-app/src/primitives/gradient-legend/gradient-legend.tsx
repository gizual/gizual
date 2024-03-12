import React from "react";

import { useQuery } from "@giz/maestro/react";
import { ColorPicker } from "../color-picker";

import style from "./gradient-legend.module.scss";

type GradientLegendProps = {
  startColor: string;
  endColor: string;

  width: number;
  height: number;

  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;

  /**
   * With this option enabled, the component renders into a pure SVG
   * element without interactivity through foreign objects.
   */
  noForeignObjects?: boolean;

  /**
   * Function that returns a textual description for a given progress value.
   * Called at start and end of the legend.
   *
   * @param color Color value at that position.
   * @param progress Position on the legend, between 0 and 1.
   *
   * @returns A textual description for the given position.
   */
  descriptionFn: (progress: number, color: string) => string;
};

/**
 * Renders a visual legend for a gradient as a horizontal bar.
 * Returns an SVG element, such that it can be exported easily.
 */
function GradientLegend({
  startColor,
  endColor,
  width: desiredWidth,
  height,
  paddingTop = 5,
  paddingBottom = 5,
  paddingX = 10,
  descriptionFn,
  noForeignObjects,
}: GradientLegendProps) {
  const { query, updateQuery } = useQuery();
  if (height < 50) {
    console.error("Cannot construct gradient legend with height < 50px");
    return <></>;
  }

  const startText = descriptionFn(0, startColor);
  const endText = descriptionFn(1, endColor);

  const measureTextWidth = React.useCallback((text: string, fontSize: number) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return 0;
    }
    context.font = `${fontSize}px Iosevka Extended`;
    const metrics = context.measureText(text);
    return metrics.width;
  }, []);

  const startTextWidth = measureTextWidth(startText, 12);
  const endTextWidth = measureTextWidth(endText, 12);

  const width = Math.max(desiredWidth, startTextWidth + endTextWidth + paddingX * 4);
  if (width > desiredWidth) {
    console.warn(
      "Gradient legend width was adjusted to be larger than desired width due to text size constraints.",
    );
  }

  function onAcceptStartColor(v: string) {
    if (query.preset && "gradientByAge" in query.preset) {
      updateQuery({
        preset: { ...query.preset, gradientByAge: [v, query.preset.gradientByAge[1]] },
      });
    }
  }

  function onAcceptEndColor(v: string) {
    if (query.preset && "gradientByAge" in query.preset) {
      updateQuery({
        preset: { ...query.preset, gradientByAge: [query.preset.gradientByAge[0], v] },
      });
    }
  }

  const usableWidth = width - startTextWidth / 2 - endTextWidth / 2 - paddingX * 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <defs>
        <linearGradient id="d-lgradient">
          <stop offset="0%" style={{ stopColor: startColor }} />
          <stop offset="100%" style={{ stopColor: endColor }} />
        </linearGradient>
      </defs>

      <g id="g-legend" style={{ transform: `translate(0px, ${8 + paddingTop}px)` }}>
        <>
          <text
            className={style.GradientTextElement}
            x={paddingX + startTextWidth / 2}
            y={0}
            fontSize={12}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {startText}
          </text>

          <text
            className={style.GradientTextElement}
            x={width - endTextWidth / 2 - paddingX}
            y={0}
            fontSize={12}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {endText}
          </text>
        </>
        {!noForeignObjects && (
          /* noForeignObjects === false */
          <>
            <foreignObject x={paddingX} y={height - 34 - 8 - paddingTop} width={34} height={34}>
              <ColorPicker hexValue={startColor} onAccept={onAcceptStartColor} />
            </foreignObject>

            <foreignObject
              x={width - paddingX - 34}
              y={height - 34 - 8 - paddingTop}
              width={34}
              height={34}
            >
              <ColorPicker hexValue={endColor} onAccept={onAcceptEndColor} />
            </foreignObject>
          </>
        )}
      </g>

      <g id="g-gradient">
        <rect
          x={startTextWidth / 2 + paddingX}
          y={paddingTop + 30}
          width={usableWidth}
          height={height - paddingTop - paddingBottom - 30}
          fill="url(#d-lgradient)"
        />
      </g>
    </svg>
  );
}

const MemoizedGradientLegend = React.memo(GradientLegend);
export { MemoizedGradientLegend as GradientLegend };
