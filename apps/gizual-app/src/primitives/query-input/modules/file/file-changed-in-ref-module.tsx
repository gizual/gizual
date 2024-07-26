import { IconFile } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQuery } from "@app/services/local-query";
import { observer } from "mobx-react-lite";

import type { QueryError } from "@giz/maestro";
import { SearchQueryType } from "@giz/query";
import { ViewMode } from "../../shared";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

const QUERY_ID = "files.changedInRef";

function getChangedInRefEntry(query: SearchQueryType) {
  if (query.files && "changedInRef" in query.files && !Array.isArray(query.files.changedInRef))
    return query.files.changedInRef;
  return "";
}

function checkErrors(errors: QueryError[] | undefined) {
  return errors?.some((e) => e.selector === QUERY_ID);
}

type FileChangedInRefModuleProps = {
  viewMode?: ViewMode;
};

const FileChangedInRefModule = observer(({ viewMode }: FileChangedInRefModuleProps) => {
  const { localQuery, updateLocalQuery, publishLocalQuery, errors } = useLocalQuery();
  const value = getChangedInRefEntry(localQuery);

  if (viewMode === "modal") {
    return (
      <div className={style.Module__Column}>
        <Input
          error={checkErrors(errors)}
          placeholder="Example: HEAD, master, origin/master, etc."
          label="Revision"
          onBlur={() => publishLocalQuery()}
          onChange={(e) =>
            updateLocalQuery({ files: { changedInRef: e.currentTarget.value ?? "" } })
          }
          value={value}
        />
      </div>
    );
  }

  return (
    <FileBaseQueryModule
      containsErrors={checkErrors(errors)}
      icon={<IconFile />}
      title={"Changed in revision"}
      hasSwapButton
      disableItems={["changedInRef"]}
      highlightItems={["changedInRef"]}
      hasHelpTooltip
      helpContent="Enter a valid git revision to search for. Example: HEAD, master, origin/master, etc."
    >
      <div className={style.SpacedChildren}>
        <Input
          error={checkErrors(errors)}
          onBlur={() => publishLocalQuery()}
          onChange={(e) =>
            updateLocalQuery({ files: { changedInRef: e.currentTarget.value ?? "" } })
          }
          value={value}
        />
      </div>
    </FileBaseQueryModule>
  );
});

export { FileChangedInRefModule };
