import clsx from "clsx";

import { Select } from "../select";
import { ToggleButton } from "../toggle-button/toggle-button";

import style from "./repo-panel.module.scss";
import sharedStyle from "../css/shared-styles.module.scss";
import { RepoPanelViewModel } from "./repo-panel.vm";

export type RepoPanelProps = {
  vm?: RepoPanelViewModel;
};

export function RepoPanel({ vm }: RepoPanelProps) {
  if (!vm) vm = new RepoPanelViewModel();

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
              onValueChange={vm.onBranchChange}
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
        <div className={sharedStyle.sectionBody}></div>
      </div>
      <div className={sharedStyle.section}>
        <div className={sharedStyle.sectionHead}>
          <h1>Files</h1>
        </div>
        <div className={sharedStyle.sectionBody}></div>
      </div>
    </div>
  );
}
