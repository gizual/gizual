import { IconClock, IconFile, IconSettingsOutline } from "@app/assets";
import { Select, SelectOption } from "@app/primitives/select";
import { observer } from "mobx-react-lite";

import { useQuery } from "@giz/maestro/react";
import { FilesModuleProvider, PresetModuleProvider, TimeModuleProvider } from "../module-provider";
import { getFileMenuItems } from "../modules/file/file-menu";
import { getTimeMenuItems } from "../modules/time/time-menu";

import style from "./query-editor.module.scss";

const QueryEditor = observer(() => {
  const query = useQuery();
  /**
   * We register the `onClick` from the menu definitions as the payload of our Select component.
   * This allows us to call it when the user selects an item without redefining the logic here.
   */

  const timeMenuItems = getTimeMenuItems({
    query,
    highlightItems: Object.keys(query.query.time || {}),
  });
  const availableTimeMenuItems: SelectOption<() => void>[] = [];
  const highlightedTimeMenuItem = timeMenuItems.find((item) => item.highlighted);
  const selectedTimeMenuItem = highlightedTimeMenuItem && highlightedTimeMenuItem.key;
  for (const item of timeMenuItems) {
    if (!item.disabled) {
      availableTimeMenuItems.push({ label: item.title, value: item.key, payload: item.onClick });
    }
  }
  const onChangeTimeModule = (cbFn: () => void) => {
    cbFn();
  };

  let fileMenuItemsToHighlight = Object.keys(query.query.files || {});
  if (query.query.files && "path" in query.query.files && !Array.isArray(query.query.files.path)) {
    fileMenuItemsToHighlight = ["pattern"];
  }
  if (query.query.files && "path" in query.query.files && Array.isArray(query.query.files.path)) {
    fileMenuItemsToHighlight = ["filePicker"];
  }
  const fileMenuItems = getFileMenuItems({
    query,
    highlightItems: fileMenuItemsToHighlight,
  });
  const availableFileMenuItems: SelectOption<() => void>[] = [];
  const highlightedFileMenuItem = fileMenuItems.find((item) => item.highlighted);
  const selectedFileMenuItem = highlightedFileMenuItem && highlightedFileMenuItem.key;
  for (const item of fileMenuItems) {
    if (!item.disabled) {
      availableFileMenuItems.push({ label: item.title, value: item.key, payload: item.onClick });
    }
  }
  const onChangeFileModule = (cbFn: () => void) => {
    cbFn();
  };

  return (
    <>
      <div className={style.QueryEditor}>
        <div className={style.Section} id="query-editor-time">
          <div className={style.Section__Heading}>
            <IconClock className={style.Heading__Icon} />
            <h2 className={style.Heading__Title}>Time</h2>
          </div>
          <div className={style.Section__Body}>
            <Select<() => void>
              label="Selector"
              data={availableTimeMenuItems}
              value={selectedTimeMenuItem}
              onChange={(v, cbFn) => onChangeTimeModule(cbFn)}
              checkIconPosition="left"
              withCheckIcon
            />
            <TimeModuleProvider viewMode="modal" />
          </div>
        </div>
        <hr className={style.Divider} />
        <div className={style.Section} id="query-editor-files">
          <div className={style.Section__Heading}>
            <IconFile className={style.Heading__Icon} />
            <h2 className={style.Heading__Title}>Files</h2>
          </div>
          <div className={style.Section__Body}>
            <Select<() => void>
              label="Selector"
              data={availableFileMenuItems}
              value={selectedFileMenuItem}
              onChange={(v, cbFn) => onChangeFileModule(cbFn)}
              checkIconPosition="left"
              withCheckIcon
            />
            <FilesModuleProvider viewMode="modal" />
          </div>
        </div>
        <hr className={style.Divider} />
        <div className={style.Section} id="query-editor-vis">
          <div className={style.Section__Heading}>
            <IconSettingsOutline className={style.Heading__Icon} />
            <h2 className={style.Heading__Title}>Visualization</h2>
          </div>
          <div className={style.Section__Body} style={{ display: "block" }}>
            <PresetModuleProvider viewMode="modal" />
          </div>
        </div>
      </div>
    </>
  );
});

export { QueryEditor };
