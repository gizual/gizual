import { IconCommandLine, IconGitBranchLine } from "@app/assets";
import { useMainController } from "@app/controllers";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { IconButton } from "@app/primitives/icon-button";
import { Select } from "@app/primitives/select";
import { Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import React from "react";

import { AdvancedEditor } from "../advanced/advanced-editor";
import { SearchBarViewModel } from "../search-bar.vm";

import { GlobModule } from "./modules";
import { AgeGradientModule } from "./modules/highlights";
import { TimeRangeModule } from "./modules/time";
import style from "./simple-search.module.scss";

export type SimpleSearchBarProps = {
  vm?: SearchBarViewModel;
};

export const SimpleSearchBar = observer(({ vm: externalVm }: SimpleSearchBarProps) => {
  const mainController = useMainController();

  const vm: SearchBarViewModel = React.useMemo(() => {
    return externalVm || new SearchBarViewModel(mainController);
  }, [externalVm]);

  return (
    <div className={style.Container}>
      <div className={style.Clickable}>
        <div className={style.Content}>
          <Select
            value={mainController.selectedBranch}
            componentStyle={{ width: 229, height: "100%", margin: "auto 0" }}
            onChange={(e) => {
              mainController.setBranchByName(e);
            }}
            size="middle"
            options={mainController.branchNames.map((b) => {
              return { label: b, value: b };
            })}
            icon={<IconGitBranchLine />}
          />

          {/* TODO: Simple way to attach default modules for now, should be handled in a provider. */}
          <TimeRangeModule />
          <GlobModule />
          <AgeGradientModule />

          <DialogProvider
            title="Advanced Query Builder"
            trigger={
              <Tooltip title="Open advanced query builder">
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
            <AdvancedEditor vm={vm} />
          </DialogProvider>
        </div>
      </div>
    </div>
  );
});
