import { useMainController } from "@app/controllers";
import { DATE_FORMAT } from "@app/utils";
import { DatePicker, DatePickerProps } from "antd";
import clsx from "clsx";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";

import { ReactComponent as TrashIcon } from "../../../assets/icons/trash.svg";
import style from "../search-bar.module.scss";
import { AvailableTagId, AvailableTags } from "../search-tags";

export type DateTimeInputAssist = {
  tagId: AvailableTagId;
};

export const DateTimeInputAssist = observer(({ tagId }: DateTimeInputAssist) => {
  const mainController = useMainController();
  const tag = AvailableTags[tagId];

  const vm = mainController.vmController.searchBarViewModel;
  if (!vm) return <></>;

  const selectedTag = vm.tags.find((t) => t.tag.id === tagId);
  if (!selectedTag) return <></>;

  const onChange: DatePickerProps["onChange"] = (date, dateString) => {
    vm.updateTag(tag.id, dateString);
  };

  let currentDate = dayjs(selectedTag.value, DATE_FORMAT);
  if (!currentDate.isValid()) currentDate = dayjs();

  const defaultStartDate =
    vm._mainController.vmController.timelineViewModel?.defaultStartDate?.toString();

  const defaultEndDate =
    vm._mainController.vmController.timelineViewModel?.defaultEndDate?.toString();

  return (
    <>
      <div className={style.SearchOverlayHintEntry}>
        {tag.id === "start" && <p>Pick a custom start date: </p>}
        {tag.id === "end" && <p>Pick a custom end date: </p>}
        <DatePicker onChange={onChange} format={DATE_FORMAT} size="small" />
      </div>
      {tag.id === "start" && defaultStartDate && (
        <div
          className={style.SearchOverlayHintEntry}
          onClick={() => {
            vm.updateTag(tagId, defaultStartDate);
          }}
        >
          <p>{`${defaultStartDate} (default)`}</p>
        </div>
      )}
      {tag.id === "end" && defaultEndDate && (
        <div
          className={style.SearchOverlayHintEntry}
          onClick={() => {
            vm.updateTag(tagId, defaultEndDate);
          }}
        >
          <p>{`${defaultEndDate} (default)`}</p>
        </div>
      )}
      <hr />
      <div
        className={clsx(style.SearchOverlayHintEntry, style.RemoveTagEntry)}
        onClick={() => {
          vm.removeTag(selectedTag);
        }}
      >
        <TrashIcon style={{ margin: 0 }} />
        <p>Remove Tag</p>
      </div>
    </>
  );
});
