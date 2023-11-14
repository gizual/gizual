import { IconClose } from "@app/assets";
import { useMainController } from "@app/controllers";
import { App, Tooltip } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import sharedStyle from "../css/shared-styles.module.scss";
import { IconButton } from "../icon-button";

import style from "./title-bar.module.scss";

export const TitleBar = observer(() => {
  const mainController = useMainController();
  const { modal } = App.useApp();

  return (
    <div className={style.TitleBar}>
      <div className={style.Branding}>
        <img className={style.Logo} src="./giz-icon.svg" alt="Gizual Logo" />
        <h1 className={style.Title}>gizual</h1>
      </div>
      <div className={style.Menu}>
        <div className={style.Left}>
          {mainController._selectedPanel === "welcome" && (
            <div
              className={clsx(
                style.MenuItem,
                mainController._selectedPanel === "welcome" ? style.Selected : undefined,
              )}
            >
              <a className={style.MenuItemText} onClick={() => mainController.setPanel("welcome")}>
                {" "}
                Welcome
              </a>
            </div>
          )}

          {mainController._selectedPanel !== "welcome" && (
            <>
              <div
                className={clsx(
                  style.MenuItem,
                  mainController._selectedPanel === "explore" ? style.Selected : undefined,
                )}
              >
                <a
                  className={style.MenuItemText}
                  onClick={() => mainController.setPanel("explore")}
                >
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
                <a
                  className={style.MenuItemText}
                  onClick={() => mainController.setPanel("analyze")}
                >
                  Analyze
                </a>
              </div>

              <div
                className={clsx(
                  style.MenuItem,
                  mainController._selectedPanel === "settings" ? style.Selected : undefined,
                )}
              >
                <a
                  className={style.MenuItemText}
                  onClick={() => mainController.setPanel("settings")}
                >
                  Settings
                </a>
              </div>
            </>
          )}
        </div>
        {mainController._selectedPanel !== "welcome" && (
          <div className={style.Right}>
            <h3 className={style.InfoText}>Repository: {mainController.repoName}</h3>
            <Tooltip title="Close repository">
              <IconButton
                className={sharedStyle.CloseButton}
                onClick={() => {
                  modal.confirm({
                    content: "Do you wish to close the repository?",
                    okText: "Close repository",
                    okButtonProps: { danger: true },
                    cancelText: "Cancel",
                    onCancel: () => {},
                    onOk: () => {
                      window.location.reload();
                      //mainController.closeRepository();
                    },
                  });
                }}
              >
                <IconClose />
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
});
