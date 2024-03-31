import { IconClock, IconGitBranchLine, IconRuler } from "@app/assets";
import { useMainController, useSettingsController } from "@app/controllers";
import { DatePicker } from "@app/primitives/date-picker";
import { IconButton } from "@app/primitives/icon-button";
import { Select } from "@app/primitives/select";
import { useLocalQuery } from "@app/services/local-query";
import { Tooltip } from "@mantine/core";
import clsx from "clsx";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import weekday from "dayjs/plugin/weekday";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";

import type { QueryError } from "@giz/maestro";
import { SearchQueryType } from "@giz/query";
import { DATE_FORMAT } from "@giz/utils/gizdate";
import { ViewMode } from "../../shared";
import style from "../modules.module.scss";

import { TimeBaseQueryModule } from "./time-base-module";

dayjs.extend(weekday);
dayjs.extend(localeData);

const QUERY_ID = "time.rangeByDate";

function getBranchEntry(query: SearchQueryType) {
  if (query.branch) return query.branch;
  return "";
}

function checkErrors(errors: QueryError[] | undefined) {
  return errors?.some((e) => e.selector === QUERY_ID);
}

type TimeRangeByDateModuleProps = {
  viewMode?: ViewMode;
};

const TimeRangeByDateModule = observer(({ viewMode = "bar" }: TimeRangeByDateModuleProps) => {
  const { localQuery, publishLocalQuery, updateLocalQuery, errors } = useLocalQuery();
  const mainController = useMainController();
  const settingsController = useSettingsController();

  const branchValue = getBranchEntry(localQuery);
  const branches = mainController.branchNames.map((b) => {
    return { label: b, value: b };
  });
  const isTimelineOpen = settingsController.timelineSettings.displayMode.value === "visible";

  let startDate = dayjs("2023/01/01", DATE_FORMAT);
  let endDate = dayjs("2023/12/31", DATE_FORMAT);

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

  const onToggleTimeline = () => {
    runInAction(() => {
      settingsController.timelineSettings.displayMode.value = isTimelineOpen
        ? "collapsed"
        : "visible";
    });
  };

  if (viewMode === "modal") {
    return (
      <div className={style.Module__Column}>
        <Select
          onChange={(branch) => {
            updateLocalQuery({ branch });
            publishLocalQuery();
          }}
          value={branchValue}
          data={[{ label: "HEAD", value: "HEAD" }, ...branches]}
          label="Branch"
          withCheckIcon
        />

        <div className={style.Module__SpaceBetween}>
          <DatePicker
            label="Range (Start)"
            error={checkErrors(errors)}
            value={startDate.toDate()}
            onChange={onChangeStartDate}
            style={{ width: "100%" }}
          />
          <DatePicker
            label="Range (End)"
            error={checkErrors(errors)}
            value={endDate.toDate()}
            onChange={onChangeEndDate}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  }

  return (
    <TimeBaseQueryModule
      containsErrors={checkErrors(errors)}
      icon={<IconClock />}
      title={"Range by date:"}
      hasSwapButton
      disableItems={["rangeByDate"]}
      highlightItems={["rangeByDate"]}
      hasHelpTooltip
      helpContent="Select a date range to filter the results by. Additionally, this module requires the selection of a branch."
    >
      <div className={style.SpacedChildren}>
        <DatePicker
          aria-label="Oldest point in time"
          error={checkErrors(errors)}
          value={startDate.toDate()}
          onChange={onChangeStartDate}
        />
        <DatePicker
          aria-label="Newest point in time"
          error={checkErrors(errors)}
          value={endDate.toDate()}
          onChange={onChangeEndDate}
        />

        <Tooltip label="Toggle timeline visibility" position="top" withArrow>
          <IconButton
            className={clsx(
              style.ToggleButton,
              isTimelineOpen ? style.IconToggled : style.IconUnToggled,
            )}
            style={{ padding: 0, width: 30, height: 30 }}
          >
            <IconRuler
              className={clsx(style.IconBase, style.IconLarge)}
              onClick={onToggleTimeline}
            />
          </IconButton>
        </Tooltip>

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
          data={[{ label: "HEAD", value: "HEAD" }, ...branches]}
        />
      </div>
    </TimeBaseQueryModule>
  );
});

export { TimeRangeByDateModule };
