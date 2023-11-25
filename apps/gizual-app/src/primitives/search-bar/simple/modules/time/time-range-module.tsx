import { IconClock, IconGitFork } from "@app/assets";
import { useSettingsController } from "@app/controllers";
import { DATE_FORMAT } from "@app/utils";
import { DatePicker } from "antd";
import clsx from "clsx";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import weekday from "dayjs/plugin/weekday";
import { runInAction } from "mobx";

import { useQuery } from "@giz/maestro/react";
import { SimpleSearchModule } from "../base-module";
import style from "../modules.module.scss";
dayjs.extend(weekday);
dayjs.extend(localeData);

export function TimeRangeModule() {
  const query = useQuery();
  console.log("Query, query.query", query, query.query);
  const settingsController = useSettingsController();
  const isTimelineOpen = settingsController.timelineSettings.displayMode.value === "visible";

  let startDate = dayjs("2023-01-01");
  let endDate = dayjs("2023-12-31");

  if (
    query.query.time &&
    "rangeByDate" in query.query.time &&
    Array.isArray(query.query.time.rangeByDate)
  ) {
    startDate = dayjs(query.query.time.rangeByDate.at(0));
    endDate = dayjs(query.query.time.rangeByDate.at(-1));
  }

  const onChangeStartDate = (d: any | null) => {
    query.updateQuery({
      time: {
        rangeByDate: [
          d?.format(DATE_FORMAT) ?? startDate.format(DATE_FORMAT),
          endDate.format(DATE_FORMAT),
        ],
      },
    });
  };

  const onChangeEndDate = (d: any | null) => {
    query.updateQuery({
      time: {
        rangeByDate: [
          startDate.format(DATE_FORMAT),
          d?.format(DATE_FORMAT) ?? endDate.format(DATE_FORMAT),
        ],
      },
    });
  };

  return (
    <SimpleSearchModule icon={<IconClock />} title={"Time Range:"} hasRemoveIcon>
      <div className={style.SpacedChildren}>
        <DatePicker
          size="small"
          defaultValue={startDate}
          onChange={(d) => onChangeStartDate(d)}
          clearIcon={false}
          suffixIcon={false}
          format={DATE_FORMAT}
        />
        <DatePicker
          size="small"
          value={endDate}
          onChange={onChangeEndDate}
          clearIcon={false}
          suffixIcon={false}
          format={DATE_FORMAT}
        />
        <IconGitFork
          className={clsx(style.IconBase, isTimelineOpen ? style.IconToggled : style.IconUnToggled)}
          onClick={() => {
            runInAction(() => {
              settingsController.timelineSettings.displayMode.value = isTimelineOpen
                ? "collapsed"
                : "visible";
            });
          }}
        />
      </div>
    </SimpleSearchModule>
  );
}
