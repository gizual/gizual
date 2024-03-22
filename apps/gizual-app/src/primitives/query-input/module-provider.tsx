import { observer } from "mobx-react-lite";
import React from "react";
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
import { ViewMode } from "./shared";

type ModuleProviderProps = {
  viewMode: ViewMode;
};

const ModuleProvider = observer(({ viewMode }: ModuleProviderProps) => {
  return (
    <>
      <TimeModuleProvider viewMode={viewMode} />
      <FilesModuleProvider viewMode={viewMode} />
      <PresetModuleProvider viewMode={viewMode} />
    </>
  );
});

const TimeModuleProvider = observer(({ viewMode }: ModuleProviderProps) => {
  const { query } = useQuery();
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

  return React.cloneElement(timeMatch, { viewMode });
});

const FilesModuleProvider = observer(({ viewMode }: ModuleProviderProps) => {
  const { query } = useQuery();
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

  return React.cloneElement(fileMatch, { viewMode });
});

const PresetModuleProvider = observer(({ viewMode }: ModuleProviderProps) => {
  const { query } = useQuery();

  const presetMatch = match(query)
    .with({ type: P.select() }, (type) => {
      if (type) return <TypeModuleComponent key="type-module" />;
      return <TypePlaceholderModule key="type-placeholder-module" />;
    })
    .otherwise(() => {
      return <TypePlaceholderModule key="type-placeholder-module" />;
    });

  return React.cloneElement(presetMatch, { viewMode });
});

export { FilesModuleProvider, ModuleProvider, PresetModuleProvider, TimeModuleProvider };
