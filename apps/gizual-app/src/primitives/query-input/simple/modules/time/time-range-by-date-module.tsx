import { IconClock, IconGitBranchLine, IconRuler } from "@app/assets";
import { useMainController, useSettingsController } from "@app/controllers";
import { Select } from "@app/primitives/select";
import { useLocalQueryCtx } from "@app/utils";
import { DatePickerInput } from "@mantine/dates";
import clsx from "clsx";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import weekday from "dayjs/plugin/weekday";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";

import { SearchQueryType } from "@giz/query";
import { DATE_FORMAT } from "@giz/utils/gizdate";
import style from "../modules.module.scss";

import { TimeBaseQueryModule } from "./time-base-module";
dayjs.extend(weekday);
dayjs.extend(localeData);

function getBranchEntry(query: SearchQueryType) {
  if (query.branch) return query.branch;
  return "";
}

export const TimeRangeByDateModule = observer(() => {
  const { localQuery, publishLocalQuery, updateLocalQuery } = useLocalQueryCtx();
  const mainController = useMainController();
  const settingsController = useSettingsController();

  const branchValue = getBranchEntry(localQuery);
  const branches = mainController.branchNames.map((b) => {
    return { label: b, value: b };
  });
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
      hasHelpTooltip
      helpContent="Select a date range to filter the results by. Additionally, this module requires the selection of a branch."
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

        <div
          className={style.QueryModuleIconWithText}
          style={{ borderLeft: "1px solid var(--border-primary)", paddingLeft: "0.5rem" }}
        >
          <div className={style.QueryModuleIcon}>
            <IconGitBranchLine />
          </div>
          <div className={style.QueryModuleTitle}>Branch:</div>
        </div>
        <Select
          onChange={(branch) => {
            updateLocalQuery({ branch });
            publishLocalQuery();
          }}
          value={branchValue}
          data={branches}
          style={{ width: 150 }}
        ></Select>

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