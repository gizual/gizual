import { GradientLegend } from "@app/primitives/gradient-legend";
import { observer } from "mobx-react-lite";
import React from "react";
import { match } from "ts-pattern";

import { useQuery } from "@giz/maestro/react";
import { getDateFromFormattedString } from "@giz/utils/gizdate";
import style from "../canvas.module.scss";

type LegendProps = {
  legendWidth: number;
  legendHeight: number;

  showLegend?: boolean;
};

const LegendComponent = observer(
  ({ showLegend = true, legendWidth, legendHeight }: LegendProps) => {
    const { query } = useQuery();

    return match(query.type)
      .with("file-lines", "file-mosaic", () => {
        let colorStart = "#ff0000";
        let colorEnd = "#00ffff";
        let descriptionStart = "XXXX-XX-XX";
        let descriptionEnd = "XXXX-XX-XX";

        if (
          query.preset &&
          "gradientByAge" in query.preset &&
          query.time &&
          "rangeByDate" in query.time
        ) {
          colorStart = query.preset.gradientByAge[0];
          colorEnd = query.preset.gradientByAge[1];
          descriptionStart = getDateFromFormattedString(
            query.time.rangeByDate[0],
          ).toDisplayString();
          descriptionEnd = getDateFromFormattedString(query.time.rangeByDate[1]).toDisplayString();
        } else {
          return <></>;
        }

        return (
          <div
            className={style.LegendContainer}
            style={{ opacity: showLegend ? 0.8 : 0, transition: "opacity 0.2s ease-out" }}
          >
            <GradientLegend
              width={legendWidth}
              height={legendHeight}
              startColor={colorStart}
              endColor={colorEnd}
              descriptionFn={(p, _) => {
                return match(p)
                  .with(0, () => descriptionStart)
                  .with(1, () => descriptionEnd)
                  .otherwise(() => "ERROR");
              }}
            />
          </div>
        );
      })
      .otherwise(() => {
        return <></>;
      });
  },
);

export { LegendComponent };
