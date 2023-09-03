import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import { Tooltip } from "antd";

import { FileIcon, FileTree, getFileIcon } from "@giz/explorer";
import React from "react";

type LanguageInfo = {
  iconInfo?: FileIcon;
  percentage?: number;
};

type LanguagesProps = {
  languages?: LanguageInfo[];
  chartType?: "pie" | "bar";
};

export function parseLanguages(fileTree: FileTree) {
  const languages = new Map<number, number>();
  let numFiles = 0;

  function walk(file: FileTree) {
    if (file.children) {
      for (const child of file.children) {
        walk(child);
      }
    } else {
      numFiles += 1;
      const kind = file.kind;
      if (kind && kind !== "folder") {
        const count = languages.get(kind) || 0;
        languages.set(kind, count + 1);
      }
    }
  }

  walk(fileTree);

  const languageInfos: LanguageInfo[] = [];
  for (const [kind, count] of languages.entries()) {
    languageInfos.push({
      iconInfo: getFileIcon(kind),
      percentage: count / numFiles,
    });
  }

  return languageInfos;
}

type ChartDatum = {
  x: string;
  y: number;
  c?: string;
};

export const IconColors = {
  "light-red": "#c97071",
  "medium-red": "#ac4142",
  "dark-red": "#be2f31",
  "light-green": "#b2c38b",
  "medium-green": "#90a959",
  "dark-green": "#66783e",
  "light-yellow": "#fae0bc",
  "medium-yellow": "#f4bf75",
  "dark-yellow": "#ee9e2e",
  "light-blue": "#9dc0ce",
  "medium-blue": "#6a9fb5",
  "dark-blue": "#46788d",
  "light-maroon": "#be7953",
  "medium-maroon": "#8f5536",
  "dark-maroon": "#7c4426",
  "light-purple": "#c7a4c0",
  "medium-purple": "#aa759f",
  "dark-purple": "#825078",
  "light-orange": "#e1ad83",
  "medium-orange": "#d28445",
  "dark-orange": "#a35f27",
  "light-cyan": "#a7d0c9",
  "medium-cyan": "#75b5aa",
  "dark-cyan": "#4d9085",
  "light-pink": "#ff4ddb",
  "medium-pink": "#ff00cc",
  "dark-pink": "#cc00a3",
  "light-grey": "#a5a5a5",
  "medium-grey": "#7f7f7f",
  "dark-grey": "#7f7f7f",
};

// TypeGuard for IconColors:
function isIconColor(color: string): color is keyof typeof IconColors {
  return color in IconColors;
}

function prepareData(languages: LanguageInfo[]): ChartDatum[] {
  const data: ChartDatum[] = [];

  for (const language of languages) {
    const iconName = language.iconInfo?.icon ?? "-icon";
    const languageString = iconName.slice(0, Math.max(0, iconName.length - 5));

    // Some endings are defined multiple times, so we need to aggregate their values here.
    const alreadySetAtIndex = data.findIndex((d) => d.x === languageString);
    if (alreadySetAtIndex >= 0) {
      data[alreadySetAtIndex].y += (language.percentage ?? 0) * 100;
      continue;
    }

    const color = language.iconInfo?.color[0] ?? "white";
    const parsedColor = isIconColor(color) ? IconColors[color] : color;
    data.push({ x: languageString, y: (language.percentage ?? 0) * 100, c: parsedColor });
  }

  return data;
}

const compose =
  (
    scale: ScaleBand<string> | ScaleLinear<number, number, never>,
    accessor: (d: ChartDatum) => any,
  ) =>
  (data: ChartDatum) =>
    scale(accessor(data)) ?? 0;

export function Languages({ languages }: LanguagesProps) {
  if (!languages) return <div />;
  const data = React.useMemo(() => prepareData(languages).slice(1), [languages]);

  return (
    <ParentSize>
      {({ width, height }) => {
        if (width < 0 || height < 0) return <div />;
        const margin = { top: 20, bottom: 60, left: 60, right: 20 };

        const xMax = width - margin.left - margin.right;
        const yMax = height - margin.top - margin.bottom;

        console.log(data);
        const xScale = scaleBand({
          range: [0, xMax],
          domain: data.map((d) => d.x),
          padding: 0.4,
        });
        const yScale = scaleLinear({
          range: [yMax, 0],
          round: true,
          domain: [0, Math.max(...data.map((d) => d.y ?? 0))],
        });

        const xPoint = compose(xScale, (d) => d.x);
        const yPoint = compose(yScale, (d) => d.y ?? 0);

        return (
          <svg width={width} height={height}>
            {/* Translate AxisLeft by left margin */}
            <Group left={margin.left}>
              <AxisLeft
                scale={yScale}
                numTicks={10}
                stroke="var(--foreground-primary)"
                tickStroke="var(--foreground-primary)"
                tickLabelProps={() => ({
                  fill: "var(--foreground-primary)",
                  textAnchor: "end",
                  dx: "-0.5em",
                  dy: "+0.25em",
                })}
              />
            </Group>

            {/* Render bars */}
            {data.map((d, i) => {
              const barHeight = yMax - yPoint(d);
              return (
                <Group key={`bar-${i}`}>
                  <Tooltip title={`${d.x} - ${Math.round((d.y ?? 0) * 100) / 100}%`}>
                    <Bar
                      x={xPoint(d) + margin.left}
                      y={yMax - barHeight}
                      height={Math.max(barHeight, 0)}
                      width={xScale.bandwidth()}
                      fill={d.c}
                    />
                  </Tooltip>
                </Group>
              );
            })}

            {/* Render the bottom axis */}
            <Group top={yMax} left={margin.left}>
              <AxisBottom
                scale={xScale}
                numTicks={data.length}
                stroke="var(--foreground-primary)"
                tickLabelProps={() => ({
                  dx: "+0.25em",
                  dy: "0.1em",
                  angle: -45,
                  textAnchor: "end",
                  fontSize: 11,
                  fill: "var(--foreground-primary)",
                })}
              />
            </Group>
          </svg>
        );
      }}
    </ParentSize>
  );
}
