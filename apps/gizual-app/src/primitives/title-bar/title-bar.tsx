import { IconClose, IconPeople } from "@app/assets";
import { Panel, PANELS, useMainController } from "@app/controllers";
import { useMediaQuery } from "@app/hooks/use-media-query";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { QueryEditorModal } from "@app/primitives/query-input/query-editor/query-editor-modal";
import { Select, SelectOption } from "@app/primitives/select";
import { Modal, Stack, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import { Screen, useQuery, useScreen } from "@giz/maestro/react";
import { AuthorTable } from "../author-panel";
import sharedStyle from "../css/shared-styles.module.scss";
import { IconButton } from "../icon-button";

import { Button } from "..";
import style from "./title-bar.module.scss";

export const TitleBar = observer(() => {
  const isLargeScreen = useMediaQuery({ min: 1024 });
  const screen = useScreen();

  return (
    <div className={style.TitleBar}>
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
                Statistics
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
          <Modal opened={opened} onClose={close} centered title="Close Repository">
            <Stack gap="md">
              Do you wish to close the repository?
              <Button onClick={() => mainController.closeRepository()} variant="dangerous">
                Close repository
              </Button>
            </Stack>
          </Modal>
          <Tooltip label="Close Repository">
            <IconButton
              className={clsx(sharedStyle.CloseButton, style.IconClose)}
              onClick={open}
              isDangerous
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
  const { query } = useQuery();
  const isAuthorPanelVisible = query?.preset && "paletteByAuthor" in query.preset;

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
        <>
          <Select<Panel>
            value={selectedPanel}
            onChange={(_, panel) => {
              setSelectedPanel(panel);
            }}
            data={panels}
            style={{ maxWidth: 200, minWidth: 100 }}
          />

          <div style={{ display: "flex", gap: "0.25rem" }}>
            {isAuthorPanelVisible && (
              <DialogProvider
                trigger={
                  <Tooltip label="Open Author Modal">
                    <IconButton style={{ width: 30, height: 30 }}>
                      <IconPeople />
                    </IconButton>
                  </Tooltip>
                }
                title="Authors"
              >
                <AuthorTable />
              </DialogProvider>
            )}
            <QueryEditorModal triggerStyle={{ width: 30, height: 30 }} />
          </div>
        </>
      )}
    </div>
  );
});
