import { LocalQueryContext, useLocalQuery } from "@app/utils";
import { match, P } from "ts-pattern";

import { useQuery } from "@giz/maestro/react";

import { FileChangedInRefModule, FileGlobModule, FilePlaceholderModule } from "./modules";
import { BranchModule } from "./modules/branch";
import { TimePlaceholderModule, TimeRangeModule } from "./modules/time";
import { TypeModuleComponent, TypePlaceholderModule } from "./modules/type";

export function ModuleProvider() {
  const { query } = useQuery();
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQuery();

  const branchQuery = <BranchModule key="branch-module" />;

  const presetMatch = match(query)
    .with({ type: P.select() }, (type) => {
      if (type) return <TypeModuleComponent key="type-module" />;
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
