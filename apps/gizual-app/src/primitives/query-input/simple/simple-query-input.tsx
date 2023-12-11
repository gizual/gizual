import { IconCommandLine } from "@app/assets";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { IconButton } from "@app/primitives/icon-button";
import { LocalQueryContext, useLocalQuery } from "@app/utils";
import { Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { match, P } from "ts-pattern";

import { useQuery } from "@giz/maestro/react";
import { AdvancedEditor } from "../advanced/advanced-query-input";

import { FileChangedInRefModule, FileGlobModule, FilePlaceholderModule } from "./modules/file";
import { TimePlaceholderModule, TimeRangeModule } from "./modules/time";
import { TypeModule, TypePlaceholderModule } from "./modules/type";
import style from "./simple-query-input.module.scss";
import { BranchModule } from "./modules/branch";

export const SimpleQueryInput = observer(() => {
  return (
    <div className={style.Container}>
      <div className={style.Clickable}>
        <div className={style.Content}>
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
            <AdvancedEditor />
          </DialogProvider>
        </div>
      </div>
    </div>
  );
});

export function ModuleProvider() {
  const { query } = useQuery();
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQuery();

  const branchQuery = <BranchModule key="branch-module" />;

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
          return <FileChangedInRefModule key="changed-in-ref-module" />;
        })
        .with({ path: P.select() }, () => {
          return <FileGlobModule key="glob-module" />;
        })
        .otherwise(() => {
          return <FilePlaceholderModule key="file-placeholder-module" />;
        });
    })
    .otherwise(() => {
      return <FilePlaceholderModule key="file-placeholder-module" />;
    });

  //const stylesMatch = match(query).with({ styles: P.select() }, (styles) => {
  //  match(styles).with(P.array(), () => {
  //    return <></>;
  //  });
  //});

  return (
    <LocalQueryContext.Provider value={{ localQuery, updateLocalQuery, publishLocalQuery }}>
      {[branchQuery, presetMatch, timeMatch, fileMatch]}
    </LocalQueryContext.Provider>
  );
}
