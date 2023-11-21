import { IconClose, IconCollapse } from "@app/assets";
import { PANELS, useMainController } from "@app/controllers";
import { useWindowSize } from "@app/utils";
import { App, Tooltip } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import { Screen, useScreen } from "@giz/maestro/react";
import sharedStyle from "../css/shared-styles.module.scss";
import { IconButton } from "../icon-button";

import { Select } from "..";
import style from "./title-bar.module.scss";

export const TitleBar = observer(() => {
  const [width] = useWindowSize();
  const screen = useScreen();

  return (
    <div className={style.TitleBar}>
      <a href="/" className={clsx(style.Link, style.Branding)}>
        <img className={style.Logo} src="./giz-icon.svg" alt="Gizual Logo" />
        <h1 className={style.Title}>gizual</h1>
      </a>
      <div className={style.Menu}>
        {width > 768 ? <DesktopTitleBar screen={screen} /> : <MobileTitleBar screen={screen} />}
      </div>
    </div>
  );
});

type TitleBarProps = {
  screen: Screen;
};

const DesktopTitleBar = observer(({ screen }: TitleBarProps) => {
  const mainController = useMainController();
  const selectedPanel = mainController._selectedPanel;
  const setSelectedPanel = mainController.setPanel;

  const { modal } = App.useApp();

  return (
    <>
      <div className={style.Left}>
        {screen === "welcome" && (
          <div className={clsx(style.MenuItem, screen === "welcome" ? style.Selected : undefined)}>
            <a className={style.MenuItemText}> Welcome</a>
          </div>
        )}

        {screen !== "welcome" && (
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
      {screen !== "welcome" && (
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

const MobileTitleBar = observer(({ screen }: TitleBarProps) => {
  const mainController = useMainController();
  const selectedPanel = mainController._selectedPanel;
  const setSelectedPanel = mainController.setPanel;

  return (
    <div className={style.Right}>
      {screen === "welcome" && (
        <div className={clsx(style.MenuItem, style.Selected)}>
          <a className={style.MenuItemText}>Welcome</a>
        </div>
      )}
      {screen !== "welcome" && (
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
      )}
    </div>
  );
});
