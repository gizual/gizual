import { Radio, Skeleton, Table } from "antd";
import { observer } from "mobx-react-lite";
import React from "react";

import { useMainController } from "../../controllers";
import sharedStyle from "../css/shared-styles.module.scss";

import style from "./settings-panel.module.scss";
import { SettingsPanelViewModel } from "./settings-panel.vm";

export type SettingsPanelProps = {
  vm?: SettingsPanelViewModel;
};

export const SettingsPanel = observer(({ vm: externalVm }: SettingsPanelProps) => {
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
            {/*<ToggleButton<ColoringMode>
              ariaLabel="Coloring mode"
              values={vm.toggleColoringValues}
              selected={mainController.coloringMode}
              toggleName="coloringMode"
              onChange={(n) => vm.onColoringModeChange(n)}
            />*/}
            <Radio.Group
              buttonStyle={"solid"}
              value={mainController.coloringMode}
              onChange={(n) => vm.onColoringModeChange(n.target.value)}
            >
              {vm.toggleColoringValues.map((v) => (
                <Radio.Button key={v.value} value={v.value}>
                  {v.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
          <div className={sharedStyle.block}>
            <h3>Authors</h3>
            {vm.authors.length > 0 ? (
              <Table
                size={"small"}
                dataSource={vm.authors}
                columns={vm.columns}
                pagination={{ pageSizeOptions: [5, 10, 15] }}
              />
            ) : (
              <Skeleton active />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
