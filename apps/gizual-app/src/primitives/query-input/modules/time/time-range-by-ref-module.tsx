import { IconClock } from "@app/assets";
import { useSettingsController } from "@app/controllers";
import { Input } from "@app/primitives/input";
import { useLocalQuery } from "@app/services/local-query";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

import type { QueryError } from "@giz/maestro";
import { SearchQueryType } from "@giz/query";
import { ViewMode } from "../../shared";
import style from "../modules.module.scss";

import { TimeBaseQueryModule } from "./time-base-module";

const QUERY_ID = "time.rangeByRef";

function getTimeRangeByRefEntry(query: SearchQueryType) {
  if (query.time && "rangeByRef" in query.time) {
    if (Array.isArray(query.time.rangeByRef))
      return { from: query.time.rangeByRef[0], to: query.time.rangeByRef[1] };

    return { from: query.time.rangeByRef, to: "" };
  }
  return { from: "", to: "" };
}

function checkErrors(errors: QueryError[] | undefined): {
  error?: boolean;
  errorField1?: boolean;
  errorField2?: boolean;
} {
  const errorField1 = errors?.some((e) => e.selector === `${QUERY_ID}[0]`);
  const errorField2 = errors?.some((e) => e.selector === `${QUERY_ID}[1]`);
  return { error: errorField1 || errorField2, errorField1, errorField2 };
}

type TimeRangeByRefModuleProps = {
  viewMode?: ViewMode;
};

const TimeRangeByRefModule = observer(({ viewMode = "bar" }: TimeRangeByRefModuleProps) => {
  const { localQuery, publishLocalQuery, updateLocalQuery, errors } = useLocalQuery();
  const { from, to } = getTimeRangeByRefEntry(localQuery);
  const settingsController = useSettingsController();

  React.useEffect(() => {
    runInAction(() => {
      settingsController.timelineSettings.displayMode.value = "collapsed";
    });
  }, []);

  const onChangeStartRef = (ref: string) => {
    updateLocalQuery({
      time: {
        rangeByRef: [ref, to],
      },
    });
  };

  const onChangeEndRef = (ref: string) => {
    updateLocalQuery({
      time: {
        rangeByRef: [from, ref],
      },
    });
  };

  if (viewMode === "modal") {
    return (
      <div className={style.Module__Column}>
        <Input
          error={checkErrors(errors).errorField1}
          onBlur={() => publishLocalQuery()}
          onChange={(e) => onChangeStartRef(e.currentTarget.value)}
          value={from}
          label="From"
          monospaced
        />
        <Input
          error={checkErrors(errors).errorField2}
          onBlur={() => publishLocalQuery()}
          onChange={(e) => onChangeEndRef(e.currentTarget.value)}
          value={to}
          label="To"
          monospaced
        />
      </div>
    );
  }

  return (
    <TimeBaseQueryModule
      containsErrors={checkErrors(errors).error}
      icon={<IconClock />}
      title={"Range by Revision"}
      hasSwapButton
      disableItems={["rangeByRef"]}
      highlightItems={["rangeByRef"]}
      hasHelpTooltip
      helpContent="Enter two valid git revisions. Revisions can be specified as branch names, commit hashes, or tags."
    >
      <div className={style.SpacedChildren}>
        <div className={style.LabelWithInput}>
          From:
          <Input
            error={checkErrors(errors).errorField1}
            onBlur={() => publishLocalQuery()}
            onChange={(e) => onChangeStartRef(e.currentTarget.value)}
            value={from}
            style={{ minWidth: 370 }}
            monospaced
          />
        </div>
        <div className={style.LabelWithInput}>
          To:
          <Input
            error={checkErrors(errors).errorField2}
            onBlur={() => publishLocalQuery()}
            onChange={(e) => onChangeEndRef(e.currentTarget.value)}
            value={to}
            style={{ minWidth: 370 }}
            monospaced
          />
        </div>
      </div>
    </TimeBaseQueryModule>
  );
});

export { TimeRangeByRefModule };
