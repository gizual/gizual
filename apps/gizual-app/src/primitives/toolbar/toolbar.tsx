import { IconCenterFocus, IconMagnifyMinus, IconMagnifyPlus, IconSettings } from "@app/assets";
import { IconPeople } from "@app/assets";
import { useMainController, useViewModelController } from "@app/controllers";
import { SettingsPage } from "@app/pages";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import { IconButton } from "@app/primitives/icon-button";
import { QueryEditorModal } from "@app/primitives/query-input/query-editor/query-editor-modal";
import { Tooltip } from "@mantine/core";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import { useQuery } from "@giz/maestro/react";
import { AuthorTable } from "../author-panel";
import { DialogProvider } from "../dialog-provider";

import style from "./toolbar.module.scss";

const Toolbar = observer(() => {
  const vmController = useViewModelController();
  const mainController = useMainController();
  const canvas = vmController.canvasViewModel;
  if (!canvas) return <div />;
  const { query } = useQuery();
  const isAuthorPanelVisible = query?.preset && "paletteByAuthor" in query.preset;

  return (
    <div className={style.Toolbar}>
      <a href="/" className={clsx(style.Link, style.Branding)}>
        <img className={style.Logo} src="./giz-icon.svg" alt="Gizual Logo" />
      </a>

      <div className={style.Toolbar__Section}>
        <Tooltip label={"Filter"} position="right">
          <QueryEditorModal />
        </Tooltip>

        <DialogProvider
          title="Settings"
          trigger={
            <Tooltip label={"Open settings panel"} position="right">
              <IconButton className={style.ToolbarButton} aria-label="Settings">
                <IconSettings className={sharedStyle.ToolbarIcon} />
              </IconButton>
            </Tooltip>
          }
          triggerClassName={style.ToolbarButton}
          contentClassName={style.SettingsDialog}
        >
          <SettingsPage />
        </DialogProvider>
      </div>

      <div className={style.Toolbar__Section}>
        <Tooltip label={"Zoom out"} position="right">
          <IconButton
            className={style.ToolbarButton}
            onClick={() => canvas.zoomOut()}
            aria-label="Zoom out"
          >
            <IconMagnifyMinus className={sharedStyle.ToolbarIcon} />
          </IconButton>
        </Tooltip>
        <Tooltip label={"Zoom in"} position="right">
          <IconButton
            className={style.ToolbarButton}
            onClick={() => canvas.zoomIn()}
            aria-label="Zoom in"
          >
            <IconMagnifyPlus className={sharedStyle.ToolbarIcon} />
          </IconButton>
        </Tooltip>
        <Tooltip label={"Reset transform"} position="right">
          <IconButton
            className={style.ToolbarButton}
            onClick={() => canvas.center()}
            aria-label="Reset transform"
          >
            <IconCenterFocus className={sharedStyle.ToolbarIcon} />
          </IconButton>
        </Tooltip>
      </div>

      <div className={style.Toolbar__Section}>
        <Tooltip label={"Export as SVG"} position="right">
          <IconButton
            className={style.ToolbarButton}
            onClick={() => mainController.exportAsSVG()}
            aria-label="Zoom out"
          >
            <IconMagnifyMinus className={sharedStyle.ToolbarIcon} />
          </IconButton>
        </Tooltip>
      </div>

      {isAuthorPanelVisible && (
        <div className={style.Toolbar__Section}>
          <DialogProvider
            trigger={
              <Tooltip label="Open author modal">
                <IconButton style={{ width: 30, height: 30 }}>
                  <IconPeople />
                </IconButton>
              </Tooltip>
            }
            title="Authors"
          >
            <AuthorTable />
          </DialogProvider>
        </div>
      )}

      {/*
      <div className={style.Toolbar__Section}>
        <Tooltip label={"Help"} position="right">
          <IconButton
            className={style.ToolbarButton}
            onClick={() => console.log("HELP")}
            aria-label="Help"
          >
            <IconQuestion className={sharedStyle.ToolbarIcon} />
          </IconButton>
        </Tooltip>
      </div>
      */}
    </div>
  );
});

export { Toolbar };
