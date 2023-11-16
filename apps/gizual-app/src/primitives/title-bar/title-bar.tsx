import { IconClose, IconCollapse } from "@app/assets";
import { PANELS, useMainController } from "@app/controllers";
import { useWindowSize } from "@app/utils";
import { App, Tooltip } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import sharedStyle from "../css/shared-styles.module.scss";
import { IconButton } from "../icon-button";

import { Select } from "..";
import style from "./title-bar.module.scss";

export const TitleBar = observer(() => {
  const [width] = useWindowSize();

  return (
    <div className={style.TitleBar}>
      <div className={style.Branding}>
        <img className={style.Logo} src="./giz-icon.svg" alt="Gizual Logo" />
        <h1 className={style.Title}>gizual</h1>
      </div>
      <div className={style.Menu}>{width > 768 ? <DesktopTitleBar /> : <MobileTitleBar />}</div>
    </div>
  );
});

const DesktopTitleBar = observer(() => {
  const mainController = useMainController();
  const selectedPanel = mainController._selectedPanel;
  const setSelectedPanel = mainController.setPanel;

  const { modal } = App.useApp();

  return (
    <>
      <div className={style.Left}>
        {selectedPanel === "welcome" && (
          <div
            className={clsx(
              style.MenuItem,
              selectedPanel === "welcome" ? style.Selected : undefined,
            )}
          >
            <a className={style.MenuItemText} onClick={() => setSelectedPanel("welcome")}>
              {" "}
              Welcome
            </a>
          </div>
        )}

        {selectedPanel !== "welcome" && (
          <>
            <div
              className={clsx(
                style.MenuItem,
                selectedPanel === "explore" ? style.Selected : undefined,
              )}
            >
              <a className={style.MenuItemText} onClick={() => setSelectedPanel("explore")}>
                {" "}
                Explore
              </a>
            </div>

            <div
              className={clsx(
                style.MenuItem,
                selectedPanel === "analyze" ? style.Selected : undefined,
              )}
            >
              <a className={style.MenuItemText} onClick={() => setSelectedPanel("analyze")}>
                Analyze
              </a>
            </div>

            <div
              className={clsx(
                style.MenuItem,
                selectedPanel === "settings" ? style.Selected : undefined,
              )}
            >
              <a className={style.MenuItemText} onClick={() => setSelectedPanel("settings")}>
                Settings
              </a>
            </div>
          </>
        )}
      </div>
      {selectedPanel !== "welcome" && (
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
    </>
  );
});

const MobileTitleBar = observer(() => {
  const mainController = useMainController();
  const selectedPanel = mainController._selectedPanel;
  const setSelectedPanel = mainController.setPanel;
  return (
    <div className={style.Right}>
      <Select
        value={selectedPanel}
        icon={<IconCollapse className={style.SelectIcon} />}
        size="large"
        onChange={(e) => setSelectedPanel(e)}
        options={PANELS.map((p) => {
          const opt = p.charAt(0).toUpperCase() + p.slice(1);
          return { label: opt, value: p };
        })}
        suffixIcon={false}
      />
    </div>
  );
});
