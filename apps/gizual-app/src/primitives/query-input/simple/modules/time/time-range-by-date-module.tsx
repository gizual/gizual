import { IconClock, IconRuler } from "@app/assets";
import { useSettingsController } from "@app/controllers";
import { useLocalQueryCtx } from "@app/utils";
import { DatePickerInput } from "@mantine/dates";
import clsx from "clsx";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import weekday from "dayjs/plugin/weekday";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";

import { DATE_FORMAT } from "@giz/utils/gizdate";
import style from "../modules.module.scss";

import { TimeBaseQueryModule } from "./time-base-module";
dayjs.extend(weekday);
dayjs.extend(localeData);

export const TimeRangeByDateModule = observer(() => {
  const { localQuery, publishLocalQuery, updateLocalQuery } = useLocalQueryCtx();

  const settingsController = useSettingsController();
  const isTimelineOpen = settingsController.timelineSettings.displayMode.value === "visible";

  let startDate = dayjs("2023-01-01");
  let endDate = dayjs("2023-12-31");

  if (
    localQuery.time &&
    "rangeByDate" in localQuery.time &&
    Array.isArray(localQuery.time.rangeByDate)
  ) {
    startDate = dayjs(localQuery.time.rangeByDate.at(0));
    endDate = dayjs(localQuery.time.rangeByDate.at(-1));
  }

  const onChangeStartDate = (d: any | null) => {
    updateLocalQuery({
      time: {
        rangeByDate: [
          dayjs(d).format(DATE_FORMAT) ?? startDate.format(DATE_FORMAT),
          endDate.format(DATE_FORMAT),
        ],
      },
    });
    publishLocalQuery();
  };

  const onChangeEndDate = (d: any | null) => {
    updateLocalQuery({
      time: {
        rangeByDate: [
          startDate.format(DATE_FORMAT),
          dayjs(d).format(DATE_FORMAT) ?? endDate.format(DATE_FORMAT),
        ],
      },
    });
    publishLocalQuery();
  };

  return (
    <TimeBaseQueryModule
      icon={<IconClock />}
      title={"Range by date:"}
      hasSwapButton
      disableItems={["rangeByDate"]}
      highlightItems={["rangeByDate"]}
    >
      <div className={style.SpacedChildren}>
        <DatePickerInput
          defaultValue={startDate.toDate()}
          onChange={(d) => onChangeStartDate(d)}
          styles={{
            input: {
              height: 30,
              minHeight: 30,
              maxHeight: 30,
              padding: "0 0.5rem",
            },
          }}
        />
        <DatePickerInput
          value={endDate.toDate()}
          onChange={onChangeEndDate}
          styles={{
            input: {
              height: 30,
              minHeight: 30,
              maxHeight: 30,
              padding: "0 0.5rem",
            },
          }}
        />
        <IconRuler
          className={clsx(style.IconBase, isTimelineOpen ? style.IconToggled : style.IconUnToggled)}
          onClick={() => {
            //notifications.show({
            //  title: "Info",
            //  message: "The timeline is disabled in this demo build.",
            //  role: "alert",
            //});
            runInAction(() => {
              settingsController.timelineSettings.displayMode.value = isTimelineOpen
                ? "collapsed"
                : "visible";
            });
          }}
        />
      </div>
    </TimeBaseQueryModule>
  );
});
