import { useMainController, useSettingsController, useViewModelController } from "@app/controllers";
import { DATE_FORMAT } from "@app/utils";
import { DatePicker } from "antd";
import { observer } from "mobx-react-lite";
import React from "react";
const { RangePicker } = DatePicker;

import { Timeline } from "../../timeline";
import style from "../search-bar.module.scss";
import { AvailableTagId } from "../search-tags";

export type DateTimeInputAssist = {
  tagId: AvailableTagId;
};

export const DateTimeInputAssist = observer(({ tagId }: DateTimeInputAssist) => {
  const mainController = useMainController();
  const settingsController = useSettingsController();
  const vmController = useViewModelController();

  const timelineVisible =
    settingsController.settings.timelineSettings.displayMode.value === "collapsed";

  const vm = mainController.vmController.searchBarViewModel;
  if (!vm) return <></>;

  const selectedTag = vm.tags.find((t) => t.tag.id === tagId);
  if (!selectedTag) return <></>;

  const onRangeChange = ([start, end]: [string, string]) => {
    vm.updateTag(tagId, start + "-" + end);
    vm.evaluateTags();
  };

  const defaultStartDate =
    vm._mainController.vmController.timelineViewModel?.defaultStartDate?.toString();

  const defaultEndDate =
    vm._mainController.vmController.timelineViewModel?.defaultEndDate?.toString();

  const defaultDate =
    defaultStartDate && defaultEndDate && defaultStartDate + " - " + defaultEndDate;

  return (
    <React.Fragment key={tagId}>
      {timelineVisible && (
        <>
          <Timeline vm={mainController.vmController.timelineViewModel} />
          <hr />
        </>
      )}

      {defaultDate && (
        <div
          className={style.SearchOverlayHintEntry}
          onClick={() => {
            onRangeChange([defaultStartDate, defaultEndDate]);
          }}
        >
          <p>{`${defaultDate} (default)`}</p>
        </div>
      )}

      <div className={style.SearchOverlayHintEntry}>
        <p>Pick a custom range:</p>
        <RangePicker
          onChange={(_, dateString) => onRangeChange(dateString)}
          format={DATE_FORMAT}
          size="small"
        />
      </div>
    </React.Fragment>
  );
});
