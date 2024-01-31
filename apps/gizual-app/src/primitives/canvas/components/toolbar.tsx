import { IconCenterFocus, IconLayout, IconMagnifyMinus, IconMagnifyPlus } from "@app/assets";
import { ViewModelController } from "@app/controllers/vm.controller";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import { IconButton } from "@app/primitives/icon-button";
import { useForwardedRef } from "@app/utils/hooks";
import { Tooltip } from "@mantine/core";
import { observer } from "mobx-react-lite";

import style from "../canvas.module.scss";
import { CanvasViewModel } from "../canvas.vm";

const Toolbar = observer<any, HTMLDivElement>(
  ({ vm }: { vm: CanvasViewModel; vmController: ViewModelController }, ref) => {
    const toolbarRef = useForwardedRef(ref);
    return (
      <div className={style.Toolbar} ref={toolbarRef}>
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
          <Tooltip label={"Center"} position="right">
            <IconButton
              className={style.ToolbarButton}
              onClick={() => vm.resetScale()}
              aria-label="Center"
            >
              <IconCenterFocus className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip label={"Reflow"} position="right">
            <IconButton
              className={style.ToolbarButton}
              onClick={() => vm.reflow()}
              aria-label="Reflow"
            >
              <IconLayout className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    );
  },
  { forwardRef: true },
);

export { Toolbar };
