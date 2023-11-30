import { IconCommandLine, IconGitBranchLine } from "@app/assets";
import { useMainController } from "@app/controllers";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { IconButton } from "@app/primitives/icon-button";
import { Select } from "@app/primitives/select";
import { LocalQueryContext, useLocalQuery } from "@app/utils";
import { Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import React from "react";
import { match, P } from "ts-pattern";

import { useQuery } from "@giz/maestro/react";
import { AdvancedEditor } from "../advanced/advanced-editor";
import { SearchBarViewModel } from "../search-bar.vm";

import { ChangedInRefModule, FilePlaceholderModule, GlobModule } from "./modules/file";
import { TimePlaceholderModule, TimeRangeModule } from "./modules/time";
import { TypeModule, TypePlaceholderModule } from "./modules/type";
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

          <ModuleProvider />

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

export function ModuleProvider() {
  const { query } = useQuery();
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQuery();

  const presetMatch = match(query)
    .with({ type: P.select() }, (type) => {
      if (type) return <TypeModule key="type-module" />;
      return <TypePlaceholderModule key="type-placeholder-module" />;
    })
    .otherwise(() => {
      return <TypePlaceholderModule key="type-placeholder-module" />;
    });

  const timeMatch = match(query)
    .with({ time: P.select() }, (time) => {
      return match(time)
        .with({ rangeByDate: P.select() }, () => {
          return <TimeRangeModule key="time-range-module" />;
        })
        .otherwise(() => {
          return <TimePlaceholderModule key="time-placeholder-module" />;
        });
    })
    .otherwise(() => {
      return <TimePlaceholderModule key="time-placeholder-module" />;
    });

  const fileMatch = match(query)
    .with({ files: P.select() }, (files) => {
      return match(files)
        .with({ changedInRef: P.select() }, () => {
          return <ChangedInRefModule key="changed-in-ref-module" />;
        })
        .with({ path: P.select() }, () => {
          return <GlobModule key="glob-module" />;
        })
        .otherwise(() => {
          return <FilePlaceholderModule key="file-placeholder-module" />;
        });
    })
    .otherwise(() => {
      return <FilePlaceholderModule key="file-placeholder-module" />;
    });

  const stylesMatch = match(query).with({ styles: P.select() }, (styles) => {
    match(styles).with(P.array(), () => {
      return <></>;
    });
  });

  return (
    <LocalQueryContext.Provider value={{ localQuery, updateLocalQuery, publishLocalQuery }}>
      {[presetMatch, timeMatch, fileMatch]}
    </LocalQueryContext.Provider>
  );
}
