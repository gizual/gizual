import { IconClose } from "@app/assets";
import { Panel, PANELS, useMainController } from "@app/controllers";
import { useMediaQuery } from "@app/hooks/use-media-query";
import { Select, SelectOption } from "@app/primitives/select";
import { Modal, Stack, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import { Screen, useScreen } from "@giz/maestro/react";
import sharedStyle from "../css/shared-styles.module.scss";
import { IconButton } from "../icon-button";

import { Button } from "..";
import style from "./title-bar.module.scss";

export const TitleBar = observer(() => {
  const isLargeScreen = useMediaQuery({ min: 768 });
  const screen = useScreen();

  return (
    <div className={style.TitleBar}>
      <a href="/" className={clsx(style.Link, style.Branding)}>
        <img className={style.Logo} src="./giz-icon.svg" alt="Gizual Logo" />
        <h1 className={style.Title}>gizual</h1>
      </a>
      <div className={style.Menu}>
        {isLargeScreen ? <DesktopTitleBar screen={screen} /> : <MobileTitleBar screen={screen} />}
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
  const [opened, { open, close }] = useDisclosure(false);

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
          {mainController.repoName !== "" && mainController.repoName !== "?" && (
            <h3 className={style.InfoText}>Repository: {mainController.repoName}</h3>
          )}
          <Modal opened={opened} onClose={close} centered title="Close repository">
            <Stack gap="md">
              Do you wish to close the repository?
              <Button onClick={() => mainController.closeRepository()} variant="filled">
                Close repository
              </Button>
            </Stack>
          </Modal>
          <Tooltip label="Close repository">
            <IconButton className={sharedStyle.CloseButton} onClick={open}>
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

  const panels: SelectOption<Panel>[] = PANELS.map((p) => {
    const opt = p.charAt(0).toUpperCase() + p.slice(1);
    return { label: opt, value: p, payload: p };
  });

  return (
    <div className={style.Right}>
      {screen === "welcome" && (
        <div className={clsx(style.MenuItem, style.Selected)}>
          <a className={style.MenuItemText}>Welcome</a>
        </div>
      )}
      {screen !== "welcome" && (
        <Select<Panel>
          value={selectedPanel}
          size="md"
          onChange={(_, panel) => {
            setSelectedPanel(panel);
          }}
          data={panels}
        />
      )}
    </div>
  );
});
