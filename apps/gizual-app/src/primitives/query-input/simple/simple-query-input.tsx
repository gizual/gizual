import { IconCommandLine } from "@app/assets";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { IconButton } from "@app/primitives/icon-button";
import { Tooltip } from "@mantine/core";
import { observer } from "mobx-react-lite";

import { AdvancedEditor } from "../advanced/advanced-query-input";

import { ModuleProvider } from "./module-provider";
import style from "./simple-query-input.module.scss";

export const SimpleQueryInput = observer(() => {
  return (
    <div className={style.Container}>
      <div className={style.Clickable}>
        <div className={style.Content}>
          <ModuleProvider />

          <DialogProvider
            title="Advanced Query Builder"
            trigger={
              <Tooltip label="Open advanced query builder">
                <IconButton
                  aria-label="Advanced Query Builder"
                  className={style.AdvancedSearchIconButton}
                >
                  <IconCommandLine className={style.AdvancedSearchIcon} />
                </IconButton>
              </Tooltip>
            }
            triggerClassName={style.AdvancedSearchIconTrigger}
          >
            <AdvancedEditor />
          </DialogProvider>
        </div>
      </div>
    </div>
  );
});
