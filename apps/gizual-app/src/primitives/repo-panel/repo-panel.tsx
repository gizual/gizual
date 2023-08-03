import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import sharedStyle from "../css/shared-styles.module.scss";
import FileTree from "../file-tree/file-tree";
import style from "./repo-panel.module.scss";
import { useMainController } from "@app/controllers";

export const RepoPanel = observer(() => {
  const mainController = useMainController();

  return (
    <div className={style.repoPanel}>
      <div className={sharedStyle.section}>
        <div className={sharedStyle.sectionHead}>
          <h1>Repository</h1>
        </div>
      </div>
      {/*mainController.favouriteFiles.length > 0 && (
        <div className={sharedStyle.section}>
          <div className={sharedStyle.sectionHead}>
            <h1>Favourites</h1>
          </div>
          <div className={sharedStyle.sectionBody}>
            <FileTree mode={"favourite"} />
          </div>
        </div>
      )*/}
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
});
