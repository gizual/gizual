import clsx from "clsx";

import { Button } from "../button";
import { Select } from "../select";

import style from "./repo-panel.module.scss";

export function RepoPanel() {
  return (
    <div className={style.repoPanel}>
      <div className={style.section}>
        <div className={style.sectionHead}>
          <h1>Repository</h1>
        </div>
        <div className={style.sectionBody}>
          <div className={style.block}>
            <h3>Branch</h3>
            <Select />
          </div>
          <div className={style.block}>
            <h3>Selection range</h3>
            <div className={style.selector}>
              <Button variant="filled">Commit</Button>
              <Button variant="gray">Timerange</Button>
            </div>
          </div>
          <div className={clsx(style.block)}>
            <h3>Commit</h3>
            <select />
          </div>
        </div>
      </div>
      <div className={style.section}>
        <div className={style.sectionHead}>
          <h1>Favourites</h1>
        </div>
        <div className={style.sectionBody}></div>
      </div>
      <div className={style.section}>
        <div className={style.sectionHead}>
          <h1>Files</h1>
        </div>
        <div className={style.sectionBody}></div>
      </div>
    </div>
  );
}
