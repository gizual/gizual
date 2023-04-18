import clsx from "clsx";
import { useState } from "react";

import style from "./title-bar.module.scss";

export function TitleBar() {
  const [selected, setSelected] = useState(0);
  const isExploreSelected = selected === 0;
  const isAnalyzeSelected = selected === 1;

  return (
    <div className={style.titleBar}>
      <div className={style.branding}>
        <img className={style.logo} src="./giz.png" alt="Gizual Logo" />
        <h1 className={style.title}>gizual</h1>
      </div>
      <div className={style.menu}>
        <div className={clsx(style.menuItem, isExploreSelected ? style.selected : undefined)}>
          <a className={style.menuItemText} onClick={() => setSelected(0)}>
            {" "}
            Explore
          </a>
        </div>
        <div className={clsx(style.menuItem, isAnalyzeSelected ? style.selected : undefined)}>
          <a className={style.menuItemText} onClick={() => setSelected(1)}>
            Analyze
          </a>
        </div>
      </div>
    </div>
  );
}
