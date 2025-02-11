import { IconDownload, IconOpen, IconTrash } from "@app/assets";
import { useMainController } from "@app/controllers";
import { Checkbox } from "@app/primitives/checkbox";
import { ColorPicker } from "@app/primitives/color-picker";
import { IconButton } from "@app/primitives/icon-button";
import { Input } from "@app/primitives/input";
import { Select } from "@app/primitives/select";
import { isGroupEntry, isSettingsEntry, SettingsEntry } from "@app/utils";
import { Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import _ from "lodash";
import { useContextMenu } from "mantine-contextmenu";
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
        <Tooltip label="Load Settings from JSON">
          <IconButton
            onClick={() => settingsController.importSettingsJSON()}
            aria-label="Load settings from JSON"
          >
            <IconOpen />
          </IconButton>
        </Tooltip>
        <Tooltip label="Download Settings as JSON">
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

const displayNotification = _.debounce((type: NotificationType) => {
  if (type === "updated") {
    notifications.show({
      title: "Settings updated",
      message: "Your settings have been updated.",
    });
  }

  if (type === "default") {
    notifications.show({
      title: "Setting reset",
      message: "Setting has been reset to its default value.",
    });
  }
}, 800);

export const RenderedSettingsEntry = observer(
  ({
    entry,
    prefix,
    onChange,
    onInputChange,
    onCheckChange,
    onResetToDefault,
    isDefault,
  }: {
    entry: SettingsEntry<any, any>;
    prefix?: string;
    onChange?: (e: any) => void;
    onInputChange?: (e: any) => void;
    onCheckChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
          displayNotification("updated");
        });
      };

    if (!onInputChange)
      onInputChange = (e: any) => {
        runInAction(() => {
          entry.value = e.target.value;
          settingsController.storeSettings();
          displayNotification("updated");
        });
      };

    if (!onCheckChange)
      onCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        runInAction(() => {
          entry.value = e.target.checked;
          settingsController.storeSettings();
          displayNotification("updated");
        });
      };

    if (!onResetToDefault)
      onResetToDefault = () =>
        runInAction(() => {
          entry.value = entry.defaultValue;
          settingsController.storeSettings();
          displayNotification("default");
        });

    if (!isDefault) isDefault = () => entry.value === entry.defaultValue;

    const { showContextMenu } = useContextMenu();

    const namePrefix = prefix ? `${prefix} - ` : "";

    return (
      <>
        <div
          className={style.SettingsEntry}
          onContextMenu={showContextMenu(
            [
              {
                key: "resetToDefault",
                title: "Reset to default",
                onClick: () => onResetToDefault?.(),
              },
            ],
            { styles: { item: { backgroundColor: "var(--background-secondary)" } } },
          )}
        >
          <span className={style.SettingsEntryLabel}>
            {namePrefix}
            {entry.name}
            {isDefault() && <span className={style.SettingsEntryDefault}>{" (Default)"}</span>}
            {!isDefault() && (
              <a onClick={() => onResetToDefault?.()} className={style.SettingsEntryDefault}>
                <IconTrash />
                {"Reset to default"}
              </a>
            )}
          </span>
          <span className={style.SettingsEntryDescription}>{entry.description}</span>
          <div>
            {entry.controlType === "text" && <Input onChange={onInputChange} value={entry.value} />}
            {entry.controlType === "select" && (
              <Select value={entry.value} onChange={onChange} data={entry.availableValues} />
            )}
            {entry.controlType === "color" && (
              <ColorPicker
                hexValue={entry.value}
                onAccept={(e) => {
                  onChange!(e);
                }}
              />
            )}
            {entry.controlType === "number" && (
              <Input value={entry.value} onChange={onInputChange} type="number" />
            )}
            {entry.controlType === "checkbox" && (
              <Checkbox
                checked={entry.value}
                onChange={onCheckChange}
                styles={{
                  input: {
                    backgroundColor: "var(--background-tertiary)",
                    borderColor: "var(--border-primary)",
                  },
                }}
              />
            )}
          </div>
        </div>
      </>
    );
  },
);
