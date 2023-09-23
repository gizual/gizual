import { useMainController } from "@app/controllers";
import { isGroupEntry, isSettingsEntry, SettingsEntry } from "@app/controllers/settings.controller";
import { IconButton } from "@app/primitives/icon-button";
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

const SettingsEntry = observer(
  ({ entry, prefix }: { entry: SettingsEntry<any, any>; prefix?: string }) => {
    const mainController = useMainController();
    const settingsController = mainController._settingsController;

    const onChange = (e: any) => {
      runInAction(() => {
        entry.value = e;
        settingsController.storeSettings();
        openNotification(mainController.displayNotification, "updated");
      });
    };

    const onCheckChange = (e: CheckboxChangeEvent) => {
      runInAction(() => {
        entry.value = e.target.checked;
        settingsController.storeSettings();
        openNotification(mainController.displayNotification, "updated");
      });
    };

    const dropdownItems: MenuProps["items"] = [
      {
        key: "1",
        label: "Reset to default",
        onClick: () => {
          runInAction(() => {
            entry.value = entry.defaultValue;
            settingsController.storeSettings();
            openNotification(mainController.displayNotification, "default");
          });
        },
      },
    ];

    const namePrefix = prefix ? `${prefix} - ` : "";

    return (
      <Dropdown menu={{ items: dropdownItems }} trigger={["contextMenu"]}>
        <div className={style.settingsEntry}>
          <span className={style.settingsEntry__label}>
            {namePrefix}
            {entry.name}
            {entry.value === entry.defaultValue && (
              <span className={style.settingsEntry__default}>{" (Default)"}</span>
            )}
          </span>
          <span className={style.settingsEntry__description}>{entry.description}</span>
          <div>
            {entry.controlType === "text" && <Input onChange={onChange} value={entry.value} />}
            {entry.controlType === "select" && (
              <Select
                value={entry.value}
                style={{ width: 200 }}
                onChange={onChange}
                options={entry.availableValues}
              />
            )}
            {entry.controlType === "color" && (
              <ColorPicker
                showText
                value={entry.value}
                onChange={(e) => {
                  onChange(`#${e.toHex(false)}`);
                }}
              />
            )}
            {entry.controlType === "number" && (
              <InputNumber value={entry.value} onChange={onChange} />
            )}
            {entry.controlType === "checkbox" && (
              <Checkbox className={style.Checkbox} checked={entry.value} onChange={onCheckChange} />
            )}
          </div>
        </div>
      </Dropdown>
    );
  },
);
