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
    <div className={style.TitleBar}>
      <div className={style.Branding}>
        <img className={style.Logo} src="./giz.png" alt="Gizual Logo" />
        <h1 className={style.Title}>gizual</h1>
      </div>
      <div className={style.Menu}>
        <div className={style.Left}>
          <div
            className={clsx(
              style.MenuItem,
              mainController._selectedPanel === "explore" ? style.Selected : undefined,
            )}
          >
            <a className={style.MenuItemText} onClick={() => mainController.setPanel("explore")}>
              {" "}
              Explore
            </a>
          </div>

          <div
            className={clsx(
              style.MenuItem,
              mainController._selectedPanel === "analyze" ? style.Selected : undefined,
            )}
          >
            <a className={style.MenuItemText} onClick={() => mainController.setPanel("analyze")}>
              Analyze
            </a>
          </div>

          <div
            className={clsx(
              style.MenuItem,
              mainController._selectedPanel === "settings" ? style.Selected : undefined,
            )}
          >
            <a className={style.MenuItemText} onClick={() => mainController.setPanel("settings")}>
              Settings
            </a>
          </div>
        </div>
        <div className={style.Right}>
          <h3 className={style.InfoText}>Repository: {mainController.repoName}</h3>
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
