import { useMainController } from "@app/controllers";
import { Skeleton, Table } from "antd";
import { observer } from "mobx-react-lite";
import React from "react";

import sharedStyle from "../css/shared-styles.module.scss";

import style from "./author-panel.module.scss";
import { AuthorPanelViewModel } from "./author-panel.vm";

export type AuthorPanelProps = {
  vm?: AuthorPanelViewModel;
};

export const AuthorPanel = observer(({ vm: externalVm }: AuthorPanelProps) => {
  const mainController = useMainController();
  const vm: AuthorPanelViewModel = React.useMemo(() => {
    return externalVm || new AuthorPanelViewModel(mainController);
  }, [externalVm]);

  return (
    <div className={style.SettingsPanel}>
      <div className={sharedStyle.Section}>
        <div className={sharedStyle.SectionHead}>
          <h1>Authors</h1>
        </div>
        {/*<div className={sharedStyle.Block}>
            <h3>Coloring mode</h3>
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
              </div>*/}
        {vm.authors.length > 0 ? (
          <Table
            size={"small"}
            dataSource={vm.authors}
            columns={vm.columns}
            pagination={{ pageSizeOptions: [5, 10, 15] }}
            showHeader={false}
          />
        ) : (
          <Skeleton active />
        )}
      </div>
    </div>
  );
});
