import { IconCenterFocus, IconMagnifyMinus, IconMagnifyPlus } from "@app/assets";
import { ViewModelController } from "@app/controllers/vm.controller";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import { IconButton } from "@app/primitives/icon-button";
import { Tooltip } from "@mantine/core";
import { observer } from "mobx-react-lite";

import style from "../canvas.module.scss";
import { CanvasViewModel } from "../canvas.vm";

const Toolbar = observer(({ vm }: { vm: CanvasViewModel; vmController: ViewModelController }) => {
  return (
    <div className={style.Toolbar}>
      <div className={sharedStyle.InlineColumn}>
        <Tooltip label={"Zoom out"} position="right">
          <IconButton
            className={style.ToolbarButton}
            onClick={() => vm.zoomOut()}
            aria-label="Zoom out"
          >
            <IconMagnifyMinus className={sharedStyle.ToolbarIcon} />
          </IconButton>
        </Tooltip>
        <Tooltip label={"Zoom in"} position="right">
          <IconButton
            className={style.ToolbarButton}
            onClick={() => vm.zoomIn()}
            aria-label="Zoom in"
          >
            <IconMagnifyPlus className={sharedStyle.ToolbarIcon} />
          </IconButton>
        </Tooltip>
        <Tooltip label={"Reset transform"} position="right">
          <IconButton
            className={style.ToolbarButton}
            onClick={() => vm.center()}
            aria-label="Reset transform"
          >
            <IconCenterFocus className={sharedStyle.ToolbarIcon} />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
});

export { Toolbar };
