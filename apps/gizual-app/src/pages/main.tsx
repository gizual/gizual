import { observer } from "mobx-react-lite";
import React from "react";

import { TitleBar } from "../primitives";
import { Canvas } from "../primitives/canvas";
import { RepoPanel } from "../primitives/repo-panel";
import SearchBar from "../primitives/search-bar/search-bar";
import { SettingsPanel } from "../primitives/settings-panel";

import style from "./main.module.scss";
import { MainPageViewModel } from "./main.vm";

export type MainPageProps = {
  vm?: MainPageViewModel;
};

function MainPage({ vm: externalVm }: MainPageProps) {
  const vm: MainPageViewModel = React.useMemo(() => {
    return externalVm || new MainPageViewModel();
  }, [externalVm]);

  return (
    <div className={style.page}>
      <div>
        <TitleBar />
        <SearchBar vm={vm.searchBarVM} />
      </div>
      <div className={style.body}>
        {vm.isRepoPanelVisible && <RepoPanel />}
        <Canvas />
        {vm.isSettingsPanelVisible && <SettingsPanel />}
      </div>
    </div>
  );
}

export default observer(MainPage);
