import { IconDownload, IconOpen } from "@app/assets";
import { useMainController } from "@app/controllers";
import { IconButton } from "@app/primitives/icon-button";
import { isGroupEntry, isSettingsEntry, SettingsEntry } from "@app/utils";
import {
  Checkbox,
  ColorPicker,
  Dropdown,
  Input,
  InputNumber,
  MenuProps,
  Select,
  Tooltip,
} from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { ArgsProps } from "antd/es/notification/interface";
import _ from "lodash";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

import style from "./settings.module.scss";

export const SettingsPage = observer(() => {
  const mainController = useMainController();
  const settingsController = mainController._settingsController;
  const settings = settingsController.settings;

  return (
    <div className={style.SettingsContainer}>
      <div className={style.SettingsActionBar}>
        <Tooltip title="Load settings from JSON">
          <IconButton
            onClick={() => settingsController.importSettingsJSON()}
            aria-label="Load settings from JSON"
          >
            <IconOpen />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download settings as JSON">
          <IconButton
            onClick={() => settingsController.downloadSettingsJSON()}
            aria-label="Download settings as JSON"
          >
            <IconDownload />
          </IconButton>
        </Tooltip>
      </div>

      <div className={style.SettingsFlex}>
        {Object.values(settings).map((settingsGroup) => {
          return (
            <React.Fragment key={settingsGroup.groupName}>
              <span className={style.SettingsGroupHeader}>{settingsGroup.groupName}</span>
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
    <div className={style.SettingsGroup}>
      {Object.values(settings).map((entry, index) => {
        if (entry && (isSettingsEntry(entry) || isGroupEntry(entry))) {
          // eslint-disable-next-line unicorn/prefer-ternary
          if (isGroupEntry(entry)) {
            return <SettingsGroup key={index} settings={entry} prefix={entry.groupName} />;
          } else {
            return <RenderedSettingsEntry key={index} entry={entry} prefix={prefix} />;
          }
        }
        return;
      })}
    </div>
  );
});

type NotificationType = "default" | "updated";

const openNotification = _.debounce((open: (args: ArgsProps) => void, type: NotificationType) => {
  if (type === "updated") {
    open({
      message: "Settings updated",
      description: "Your settings have been updated.",
      duration: 2,
    });
  }

  if (type === "default") {
    open({
      message: "Setting reset",
      description: "Setting has been reset to its default value.",
      duration: 2,
    });
  }
}, 800);

export const RenderedSettingsEntry = observer(
  ({
    entry,
    prefix,
    onChange,
    onCheckChange,
    onResetToDefault,
    isDefault,
  }: {
    entry: SettingsEntry<any, any>;
    prefix?: string;
    onChange?: (e: any) => void;
    onCheckChange?: (e: CheckboxChangeEvent) => void;
    onResetToDefault?: () => void;
    isDefault?: () => boolean;
  }) => {
    const mainController = useMainController();
    const settingsController = mainController._settingsController;

    if (!onChange)
      onChange = (e: any) => {
        runInAction(() => {
          entry.value = e;
          settingsController.storeSettings();
          openNotification(mainController.displayNotification, "updated");
        });
      };

    if (!onCheckChange)
      onCheckChange = (e: CheckboxChangeEvent) => {
        runInAction(() => {
          entry.value = e.target.checked;
          settingsController.storeSettings();
          openNotification(mainController.displayNotification, "updated");
        });
      };

    if (!onResetToDefault)
      onResetToDefault = () =>
        runInAction(() => {
          entry.value = entry.defaultValue;
          settingsController.storeSettings();
          openNotification(mainController.displayNotification, "default");
        });

    if (!isDefault) isDefault = () => entry.value === entry.defaultValue;

    const dropdownItems: MenuProps["items"] = [
      {
        key: "1",
        label: "Reset to default",
        onClick: onResetToDefault,
      },
    ];

    const namePrefix = prefix ? `${prefix} - ` : "";

    return (
      <Dropdown menu={{ items: dropdownItems }} trigger={["contextMenu"]}>
        <div className={style.SettingsEntry}>
          <span className={style.SettingsEntryLabel}>
            {namePrefix}
            {entry.name}
            {isDefault() && <span className={style.SettingsEntryDefault}>{" (Default)"}</span>}
          </span>
          <span className={style.SettingsEntryDescription}>{entry.description}</span>
          <div>
            {entry.controlType === "text" && <Input onChange={onChange} value={entry.value} />}
            {entry.controlType === "select" && (
              <Select
                value={entry.value}
                style={{ width: 300 }}
                onChange={onChange}
                options={entry.availableValues}
              />
            )}
            {entry.controlType === "color" && (
              <ColorPicker
                showText
                value={entry.value}
                format="hex"
                onChange={(e) => {
                  onChange!(`#${e.toHex(false)}`);
                }}
              />
            )}
            {entry.controlType === "number" && (
              <InputNumber value={entry.value} onChange={onChange} />
            )}
            {entry.controlType === "checkbox" && (
              <Checkbox checked={entry.value} onChange={onCheckChange} />
            )}
          </div>
        </div>
      </Dropdown>
    );
  },
);
