import { useMainController } from "@app/controllers";
import { isGroupEntry, isSettingsEntry, SettingsEntry } from "@app/controllers/settings.controller";
import { IconButton } from "@app/primitives/icon-button";
import { ColorPicker, Input, InputNumber, Select, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import React from "react";

import { ReactComponent as Download } from "../../assets/icons/download.svg";
import { ReactComponent as Open } from "../../assets/icons/open.svg";

import style from "./settings.module.scss";

export const SettingsPage = observer(() => {
  const mainController = useMainController();
  const settingsController = mainController._settingsController;
  const settings = settingsController.settings;

  return (
    <div className={style.settingsContainer}>
      <div className={style.settingsActionBar}>
        <Tooltip title="Load settings from JSON">
          <IconButton
            onClick={() => settingsController.importSettingsJSON()}
            aria-label="Load settings from JSON"
          >
            <Open />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download settings as JSON">
          <IconButton
            onClick={() => settingsController.downloadSettingsJSON()}
            aria-label="Download settings as JSON"
          >
            <Download />
          </IconButton>
        </Tooltip>
      </div>

      <div className={style.settingsFlex}>
        {Object.values(settings).map((settingsGroup) => {
          return (
            <React.Fragment key={settingsGroup.groupName}>
              <span className={style.settingsGroupHeader}>{settingsGroup.groupName}</span>
              <SettingsGroup settings={settingsGroup} />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});

const SettingsGroup = observer(({ settings, prefix = "" }: { settings: any; prefix?: string }) => {
  return (
    <div className={style.settingsGroup}>
      {Object.values(settings).map((entry, index) => {
        if (entry && (isSettingsEntry(entry) || isGroupEntry(entry))) {
          // eslint-disable-next-line unicorn/prefer-ternary
          if (isGroupEntry(entry)) {
            return <SettingsGroup key={index} settings={entry} prefix={entry.groupName} />;
          } else {
            return <SettingsEntry key={index} entry={entry} prefix={prefix} />;
          }
        }
        return;
      })}
    </div>
  );
});

const SettingsEntry = observer(
  ({ entry, prefix }: { entry: SettingsEntry<any, any>; prefix?: string }) => {
    const mainController = useMainController();
    const settingsController = mainController._settingsController;

    const onChange = (e: any) => {
      entry.value = e;
      settingsController.storeSettings();
    };

    const namePrefix = prefix ? `${prefix} - ` : "";

    return (
      <div className={style.settingsEntry}>
        <span className={style.settingsEntry__label}>
          {namePrefix}
          {entry.name}
        </span>
        <span className={style.settingsEntry__description}>{entry.description}</span>
        <div>
          {entry.controlType === "text" && <Input defaultValue={entry.value} onChange={onChange} />}
          {entry.controlType === "select" && (
            <Select
              defaultValue={entry.value}
              style={{ width: 200 }}
              onChange={onChange}
              options={entry.availableValues}
            />
          )}
          {entry.controlType === "color" && (
            <ColorPicker
              showText
              defaultValue={entry.value}
              onChange={(e) => {
                onChange(`#${e.toHex(false)}`);
              }}
            />
          )}
          {entry.controlType === "number" && (
            <InputNumber defaultValue={entry.value} onChange={onChange} />
          )}
        </div>
      </div>
    );
  },
);
