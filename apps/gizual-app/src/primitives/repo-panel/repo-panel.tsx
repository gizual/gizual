import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import sharedStyle from "../css/shared-styles.module.scss";
import FileTree from "../file-tree/file-tree";
import style from "./repo-panel.module.scss";

export const RepoPanel = observer(() => {
  return (
    <div className={style.repoPanel}>
      <div className={sharedStyle.section}>
        <div className={sharedStyle.sectionHead}>
          <h1>Repository</h1>
        </div>
      </div>
      <div className={sharedStyle.section}>
        <div className={sharedStyle.sectionHead}>
          <h1>Favourites</h1>
        </div>
        <div className={sharedStyle.sectionBody}>
          <FileTree mode={"favourite"} />
        </div>
      </div>
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
