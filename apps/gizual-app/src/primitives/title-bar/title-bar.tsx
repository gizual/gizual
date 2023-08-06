import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import { useMainController } from "../../controllers";

import style from "./title-bar.module.scss";

export const TitleBar = observer(() => {
  const mainController = useMainController();

  return (
    <div className={style.titleBar}>
      <div className={style.branding}>
        <img className={style.logo} src="./giz.png" alt="Gizual Logo" />
        <h1 className={style.title}>gizual</h1>
      </div>
      <div className={style.menu}>
        <div
          className={clsx(
            style.menuItem,
            mainController._selectedPanel === "explore" ? style.selected : undefined,
          )}
        >
          <a className={style.menuItemText} onClick={() => mainController.setPanel("explore")}>
            {" "}
            Explore
          </a>
        </div>
        <div
          className={clsx(
            style.menuItem,
            mainController._selectedPanel === "analyze" ? style.selected : undefined,
          )}
        >
          <a className={style.menuItemText} onClick={() => mainController.setPanel("analyze")}>
            Analyze
          </a>
        </div>
      </div>
    </div>
  );
});
