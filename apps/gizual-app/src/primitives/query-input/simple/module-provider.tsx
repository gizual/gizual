import { observer } from "mobx-react-lite";
import { match, P } from "ts-pattern";

import { useQuery } from "@giz/maestro/react";

import {
  FileChangedInRefModule,
  FileContainsModule,
  FileCreatedByModule,
  FileEditedByModule,
  FileGlobModule,
  FileLastEditedByModule,
  FilePlaceholderModule,
  FileTreeModule,
} from "./modules/file";
import { TimePlaceholderModule, TimeRangeByDateModule, TimeRangeByRefModule } from "./modules/time";
import { TimeSinceFirstCommitByModule } from "./modules/time/time-since-first-commit-by-module";
import { TypeModuleComponent, TypePlaceholderModule } from "./modules/type";

function ModuleProvider() {
  const { query } = useQuery();

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
          return <TimeRangeByDateModule key="time-range-by-date-module" />;
        })
        .with({ rangeByRef: P.select() }, () => {
          return <TimeRangeByRefModule key="time-range-by-ref-module" />;
        })
        .with({ sinceFirstCommitBy: P.select() }, () => {
          return <TimeSinceFirstCommitByModule key="time-since-first-commit-by-module" />;
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
        .with({ path: P.select() }, (path) => {
          return match(typeof path)
            .with("string", () => {
              return <FileGlobModule key="glob-module" />;
            })
            .otherwise(() => {
              return <FileTreeModule key="file-tree-module" />;
            });
        })
        .with({ editedBy: P.select() }, () => {
          return <FileEditedByModule key="file-edited-by-module" />;
        })
        .with({ lastEditedBy: P.select() }, () => {
          return <FileLastEditedByModule key="file-last-edited-by-module" />;
        })
        .with({ createdBy: P.select() }, () => {
          return <FileCreatedByModule key="file-created-by-module" />;
        })
        .with({ contains: P.select() }, () => {
          return <FileContainsModule key="file-contains-module" />;
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

  return <>{[presetMatch, timeMatch, fileMatch]}</>;
}

const ObserverModuleProvider = observer(ModuleProvider);

export { ObserverModuleProvider as ModuleProvider };
