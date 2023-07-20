import React from "react";

import { useMainController } from "../../controllers";
import sharedStyle from "../css/shared-styles.module.scss";
import { ToggleButton } from "../toggle-button";

import style from "./settings-panel.module.scss";
import { ColoringMode, LineLengthScaling, SettingsPanelViewModel } from "./settings-panel.vm";

export type SettingsPanelProps = {
  vm?: SettingsPanelViewModel;
};

export function SettingsPanel({ vm: externalVm }: SettingsPanelProps) {
  const mainController = useMainController();
  const vm: SettingsPanelViewModel = React.useMemo(() => {
    return externalVm || new SettingsPanelViewModel(mainController);
  }, [externalVm]);

  return (
    <div className={style.settingsPanel}>
      <div className={sharedStyle.section}>
        <div className={sharedStyle.sectionHead}>
          <h1>Settings</h1>
        </div>
        <div className={sharedStyle.sectionBody}>
          <div className={sharedStyle.block}>
            <h3>Coloring mode</h3>
            <ToggleButton<ColoringMode>
              ariaLabel="Coloring mode"
              values={vm.toggleColoringValues}
              defaultChecked={0}
              toggleName="coloringMode"
              onChange={(n) => vm.onColoringModeChange(n)}
            />
          </div>
          <div className={sharedStyle.block}>
            <h3>Line length scaling</h3>
            <ToggleButton<LineLengthScaling>
              ariaLabel="Line length scaling"
              values={vm.toggleLineLengthScalingValues}
              defaultChecked={0}
              toggleName="lineLengthScaling"
              onChange={(n) => vm.onLineLengthScalingChange(n)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
