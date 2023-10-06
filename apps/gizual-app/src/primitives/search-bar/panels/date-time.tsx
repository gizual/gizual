import { useMainController } from "@app/controllers";
import { DATE_FORMAT } from "@app/utils";
import { DatePicker } from "antd";
import { observer } from "mobx-react-lite";
import React from "react";

import { Timeline } from "../../timeline";
import style from "../search-bar.module.scss";
import { AvailableTagId } from "../search-tags";

export type DateTimeInputAssist = {
  tagId: AvailableTagId;
};

export const DateTimeInputAssist = observer(({ tagId }: DateTimeInputAssist) => {
  const mainController = useMainController();
  const timelineVisible =
    mainController.settingsController.settings.timelineSettings.displayMode.value === "collapsed";

  const vm = mainController.vmController.searchBarViewModel;
  if (!vm) return <></>;

  const selectedTag = vm.tags.find((t) => t.tag.id === tagId);
  if (!selectedTag) return <></>;

  const onChange = (dateString: string, type: "start" | "end") => {
    vm.updateTagWithCallback(tagId, (value) => {
      if (value) {
        const dates = value.split("-");
        let start = dates[0];
        let end = dates[1];
        if (type === "start") start = dateString;
        if (type === "end") end = dateString;
        return start + "-" + end;
      }
      return dateString;
    });
  };

  const defaultStartDate =
    vm._mainController.vmController.timelineViewModel?.defaultStartDate?.toString();

  const defaultEndDate =
    vm._mainController.vmController.timelineViewModel?.defaultEndDate?.toString();

  return (
    <React.Fragment key={tagId}>
      {timelineVisible && (
        <>
          <Timeline vm={mainController.vmController.timelineViewModel} />
          <hr />
        </>
      )}
      <div className={style.SearchOverlayHintEntry}>
        <p>Pick a custom start date: </p>
        <DatePicker
          onChange={(_, dateString) => onChange(dateString, "start")}
          format={DATE_FORMAT}
          size="small"
        />
      </div>

      {defaultStartDate && (
        <div
          className={style.SearchOverlayHintEntry}
          onClick={() => {
            onChange(defaultStartDate, "start");
          }}
        >
          <p>{`${defaultStartDate} (default)`}</p>
        </div>
      )}

      <hr />

      <div className={style.SearchOverlayHintEntry}>
        <p>Pick a custom end date: </p>
        <DatePicker
          onChange={(_, dateString) => onChange(dateString, "end")}
          format={DATE_FORMAT}
          size="small"
        />
      </div>

      {defaultEndDate && (
        <div
          className={style.SearchOverlayHintEntry}
          onClick={() => {
            onChange(defaultEndDate, "end");
          }}
        >
          <p>{`${defaultEndDate} (default)`}</p>
        </div>
      )}
    </React.Fragment>
  );
});
