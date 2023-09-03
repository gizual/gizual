import { App, Tooltip } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import { ReactComponent as Close } from "../../assets/icons/close-box.svg";
import { useMainController } from "../../controllers";
import { IconButton } from "../icon-button";

import style from "./title-bar.module.scss";

export const TitleBar = observer(() => {
  const mainController = useMainController();
  const { modal } = App.useApp();

  return (
    <div className={style.titleBar}>
      <div className={style.branding}>
        <img className={style.logo} src="./giz.png" alt="Gizual Logo" />
        <h1 className={style.title}>gizual</h1>
      </div>
      <div className={style.menu}>
        <div className={style.left}>
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

          <div
            className={clsx(
              style.menuItem,
              mainController._selectedPanel === "settings" ? style.selected : undefined,
            )}
          >
            <a className={style.menuItemText} onClick={() => mainController.setPanel("settings")}>
              Settings
            </a>
          </div>
        </div>
        <div className={style.right}>
          <h3 className={style.infoText}>Repository: Llorem Ipsum</h3>
          <Tooltip title="Close repository">
            <IconButton
              className={style.closeButton}
              onClick={() => {
                modal.confirm({
                  content: "Do you wish to close the repository?",
                  okText: "Close repository",
                  okButtonProps: { danger: true },
                  cancelText: "Cancel",
                  onCancel: () => {},
                  onOk: () => {
                    mainController.closeRepository();
                  },
                });
              }}
            >
              <Close />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});
