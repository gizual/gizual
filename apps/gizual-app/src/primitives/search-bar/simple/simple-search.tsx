import {
  IconClock,
  IconCloseFilled,
  IconCommandLine,
  IconFile,
  IconGitBranchLine,
  IconGitFork,
} from "@app/assets";
import { useMainController } from "@app/controllers";
import { Button } from "@app/primitives/button";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { FileTree } from "@app/primitives/file-tree";
import { Select } from "@app/primitives/select";
import { DATE_FORMAT, GizDate } from "@app/utils";
import { DatePicker, Tooltip } from "antd";
import clsx from "clsx";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import weekday from "dayjs/plugin/weekday";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

import { AdvancedEditor } from "../advanced/advanced-editor";
import { SearchBarViewModel } from "../search-bar.vm";

import style from "./simple-search.module.scss";
dayjs.extend(weekday);
dayjs.extend(localeData);

export type SimpleSearchBarProps = {
  vm?: SearchBarViewModel;
};

export const SimpleSearchBar = observer(({ vm: externalVm }: SimpleSearchBarProps) => {
  const mainController = useMainController();
  const isTimelineOpen =
    mainController.settingsController.timelineSettings.displayMode.value === "visible";

  const vm: SearchBarViewModel = React.useMemo(() => {
    return externalVm || new SearchBarViewModel(mainController);
  }, [externalVm]);

  const startDate = dayjs(mainController.selectedStartDate);
  const endDate = dayjs(mainController.selectedEndDate);

  return (
    <div className={style.Container}>
      <div className={style.Clickable}>
        <div className={style.Content}>
          <Select
            value={mainController.selectedBranch}
            componentStyle={{ width: 229, height: "100%", margin: "auto 0" }}
            onChange={(e) => {
              mainController.setBranchByName(e);
            }}
            size="middle"
            options={mainController.branchNames.map((b) => {
              return { label: b, value: b };
            })}
            icon={<IconGitBranchLine />}
          />
          <SimpleSearchModule icon={<IconClock />} title={"Range:"} hasRemoveIcon>
            <div className={style.SpacedChildren}>
              <DatePicker
                size="small"
                value={startDate}
                onChange={(d) => {
                  if (!d) return;
                  mainController.setSelectedStartDate(new GizDate(d?.toDate()));
                  mainController.vmController.timelineViewModel?.initializePositionsFromSelection();
                }}
                clearIcon={false}
                suffixIcon={false}
                format={DATE_FORMAT}
              />
              <DatePicker
                size="small"
                value={endDate}
                onChange={(d) => {
                  if (!d) return;
                  mainController.setSelectedEndDate(new GizDate(d?.toDate()));
                  mainController.vmController.timelineViewModel?.initializePositionsFromSelection();
                }}
                clearIcon={false}
                suffixIcon={false}
                format={DATE_FORMAT}
              />
              <IconGitFork
                className={clsx(
                  style.IconBase,
                  isTimelineOpen ? style.IconToggled : style.IconUnToggled,
                )}
                onClick={() => {
                  runInAction(() => {
                    mainController.settingsController.timelineSettings.displayMode.value =
                      isTimelineOpen ? "collapsed" : "visible";
                  });
                }}
              />
            </div>
          </SimpleSearchModule>
          <SimpleSearchModule icon={<IconFile />} title={"Files:"} hasRemoveIcon>
            <div className={style.SpacedChildren}>
              <DialogProvider
                trigger={
                  <Button variant="filled" size="small">
                    {mainController.repoController.selectedFiles.size > 0 ? (
                      <>{mainController.repoController.selectedFiles.size} files selected</>
                    ) : (
                      <>Open file picker</>
                    )}
                  </Button>
                }
                title="File picker"
              >
                <div className={style.FileTreeWrapper}>
                  <FileTree />
                </div>
              </DialogProvider>
            </div>
          </SimpleSearchModule>
        </div>
        <DialogProvider
          title="Advanced Query Builder"
          trigger={
            <Tooltip title="Open advanced query builder">
              <IconCommandLine className={style.AdvancedSearchIcon} />
            </Tooltip>
          }
          triggerClassName={style.AdvancedSearchIconContainer}
        >
          <AdvancedEditor vm={vm} />
        </DialogProvider>
      </div>
    </div>
  );
});

export type SimpleSearchModuleProps = {
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  hasRemoveIcon?: boolean;
};

export function SimpleSearchModule(props: SimpleSearchModuleProps) {
  const mainController = useMainController();
  const { icon, title, children, hasRemoveIcon } = props;

  return (
    <div className={style.SearchModule}>
      <div className={style.SearchModuleIconWithText}>
        {icon && <div className={style.SearchModuleIcon}>{icon}</div>}
        {title && <div className={style.SearchModuleTitle}>{title}</div>}
      </div>
      {children}
      {hasRemoveIcon && (
        <IconCloseFilled
          className={style.CloseIcon}
          onClick={() => {
            mainController.displayNotification({
              message: "TODO! :)",
              description: "This feature has not been implemented",
              duration: 1,
            });
          }}
        />
      )}
    </div>
  );
}
