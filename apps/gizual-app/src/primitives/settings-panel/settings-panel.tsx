import sharedStyle from "../css/shared-styles.module.scss";
import { ToggleButton } from "../toggle-button";

import style from "./settings-panel.module.scss";
import { SettingsPanelViewModel } from "./settings-panel.vm";

export type SettingsPanelProps = {
  vm?: SettingsPanelViewModel;
};

export function SettingsPanel({ vm }: SettingsPanelProps) {
  if (!vm) vm = new SettingsPanelViewModel();

  return (
    <div className={style.settingsPanel}>
      <div className={sharedStyle.section}>
        <div className={sharedStyle.sectionHead}>
          <h1>Settings</h1>
        </div>
        <div className={sharedStyle.sectionBody}>
          <div className={sharedStyle.block}>
            <h3>Coloring mode</h3>
            <ToggleButton
              ariaLabel="Coloring mode"
              values={vm.toggleColoringValues}
              defaultChecked={0}
              toggleName="coloringMode"
            />
          </div>
          <div className={sharedStyle.block}>
            <h3>Line length scaling</h3>
            <ToggleButton
              ariaLabel="Line length scaling"
              values={vm.toggleLineLengthScalingValues}
              defaultChecked={0}
              toggleName="lineLengthScaling"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
