import clsx from "clsx";

import sharedStyle from "../css/shared-styles.module.scss";
import FileTree from "../file-tree/file-tree";
import { Select } from "../select";
import { ToggleButton } from "../toggle-button";
import { useMainController } from "../../controllers";

import style from "./repo-panel.module.scss";
import { RepoPanelViewModel } from "./repo-panel.vm";
import React from "react";

export type RepoPanelProps = {
  vm?: RepoPanelViewModel;
};

export function RepoPanel({ vm: externalVm }: RepoPanelProps) {
  const mainController = useMainController();
  const vm: RepoPanelViewModel = React.useMemo(() => {
    return externalVm || new RepoPanelViewModel(mainController);
  }, [externalVm]);

  return (
    <div className={style.repoPanel}>
      <div className={sharedStyle.section}>
        <div className={sharedStyle.sectionHead}>
          <h1>Repository</h1>
        </div>
        <div className={sharedStyle.sectionBody}>
          <div className={sharedStyle.block}>
            <h3>Branch</h3>
            <Select
              data={vm.selectBranchData}
              placeholder="Select branch ..."
              groupTitle="Select branch"
              onValueChange={(v) => vm.onBranchChange(v)}
            />
          </div>
          <div className={sharedStyle.block}>
            <h3>Selection range</h3>
            <ToggleButton
              ariaLabel="Selection range"
              values={vm.toggleRangeValues}
              defaultChecked={0}
              toggleName="selectionRange"
            />
          </div>
          <div className={clsx(sharedStyle.block)}>
            <h3>Commit</h3>
            <Select
              data={vm.selectCommitData}
              placeholder="Select commit ..."
              groupTitle="Select commit"
              onValueChange={vm.onCommitChange}
            />
          </div>
        </div>
      </div>
      <div className={sharedStyle.section}>
        <div className={sharedStyle.sectionHead}>
          <h1>Favourites</h1>
        </div>
        <div className={sharedStyle.sectionBody}>
          <FileTree mode={"favourite"} />
        </div>
      </div>
      <div className={clsx(sharedStyle.section, style.fileTree)}>
        <div className={sharedStyle.sectionHead}>
          <h1>Files</h1>
        </div>
        <div className={sharedStyle.sectionBody}>
          <FileTree />
        </div>
      </div>
    </div>
  );
}
