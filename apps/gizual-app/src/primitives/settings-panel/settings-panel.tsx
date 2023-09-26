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
    <div className={style.SettingsPanel}>
      <div className={sharedStyle.Section}>
        <div className={sharedStyle.SectionHead}>
          <h1>Settings</h1>
        </div>
        <div className={sharedStyle.SectionBody}>
          <div className={sharedStyle.Block}>
            <h3>Colouring mode</h3>
            <Radio.Group
              buttonStyle={"solid"}
              value={mainController.colouringMode}
              onChange={(n) => vm.onColouringModeChange(n.target.value)}
            >
              {vm.toggleColouringValues.map((v) => (
                <Radio.Button key={v.value} value={v.value}>
                  {v.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
          <div className={sharedStyle.Block}>
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
