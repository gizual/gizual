import { useMainController } from "@app/controllers";
import { Spin } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import sharedStyle from "../css/shared-styles.module.scss";
import { FileTreeViewModel } from "../file-tree";
import FileTree from "../file-tree/file-tree";

import style from "./repo-panel.module.scss";

export const RepoPanel = observer(() => {
  const mainController = useMainController();

  const vm: FileTreeViewModel = React.useMemo(() => {
    return new FileTreeViewModel(mainController);
  }, []);

  return (
    <div className={style.repoPanel}>
      {mainController.favouriteFiles.size > 0 && (
        <div className={sharedStyle.section}>
          <div className={sharedStyle.sectionHead}>
            <h1>Favourites</h1>
          </div>
          <div className={sharedStyle.sectionBody}>
            <FileTree vm={vm} mode={"favourite"} />
          </div>
        </div>
      )}
      <div className={clsx(sharedStyle.section, style.fileTree)}>
        <div className={style.sectionHead}>
          <h1>Files ({mainController.numFiles})</h1>
          <Spin size={"large"} spinning={mainController._repo.fileTree.loading} />
        </div>
        <div className={sharedStyle.sectionBody}>
          <FileTree vm={vm} />
        </div>
      </div>
    </div>
  );
});
