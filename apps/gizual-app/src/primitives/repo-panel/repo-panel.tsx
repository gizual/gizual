import { useMainController } from "@app/controllers";
import { Spin } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import sharedStyle from "../css/shared-styles.module.scss";
import { FileTreeViewModel } from "../file-tree";
import { FileTree } from "../file-tree/file-tree";

import style from "./repo-panel.module.scss";

export const RepoPanel = observer(() => {
  const mainController = useMainController();

  const vm: FileTreeViewModel = React.useMemo(() => {
    return new FileTreeViewModel(mainController);
  }, []);

  return (
    <div className={style.RepoPanel}>
      {mainController.favouriteFiles.size > 0 && (
        <div className={sharedStyle.Section}>
          <div className={sharedStyle.SectionHead}>
            <h1>Favourites</h1>
          </div>
          <div className={sharedStyle.SectionBody}>
            <FileTree vm={vm} mode={"favourite"} />
          </div>
        </div>
      )}
      <div className={clsx(sharedStyle.Section)}>
        <div className={style.SectionHead}>
          <h1>Files ({mainController.numFiles})</h1>
          <Spin size={"large"} spinning={mainController._repo.fileTree.loading} />
        </div>
        <div className={style.SectionBody}>
          <FileTree vm={vm} />
        </div>
      </div>
    </div>
  );
});
