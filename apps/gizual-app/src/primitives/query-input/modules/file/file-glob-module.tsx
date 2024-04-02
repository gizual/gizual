import { IconFile } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQuery } from "@app/services/local-query";
import { observer } from "mobx-react-lite";

import type { QueryError } from "@giz/maestro";
import { SearchQueryType } from "@giz/query";
import { ViewMode } from "../../shared";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

const QUERY_ID = "files.path";

function getGlobEntry(query: SearchQueryType) {
  if (query.files && "path" in query.files && !Array.isArray(query.files.path))
    return query.files.path;
  return "";
}

function checkErrors(errors: QueryError[] | undefined) {
  return errors?.some((e) => e.selector === QUERY_ID);
}

type FileGlobModuleProps = {
  viewMode?: ViewMode;
};

const FileGlobModule = observer(({ viewMode = "bar" }: FileGlobModuleProps) => {
  const { localQuery, updateLocalQuery, publishLocalQuery, errors } = useLocalQuery();
  const value = getGlobEntry(localQuery);

  if (viewMode === "modal") {
    return (
      <div className={style.Module__Column}>
        <Input
          error={checkErrors(errors)}
          label="Glob pattern"
          value={value}
          placeholder="Example: *.tsx"
          onBlur={() => publishLocalQuery()}
          onChange={(e) => updateLocalQuery({ files: { path: e.currentTarget.value } })}
        />
      </div>
    );
  }

  return (
    <FileBaseQueryModule
      containsErrors={checkErrors(errors)}
      icon={<IconFile />}
      title={"Pattern:"}
      hasSwapButton
      disableItems={["pattern"]}
      highlightItems={["pattern"]}
      hasHelpTooltip
      helpContent="Enter a valid glob pattern. Example: *.tsx"
    >
      <div className={style.SpacedChildren}>
        <Input
          error={checkErrors(errors)}
          value={value}
          placeholder="Example: *.tsx"
          onBlur={() => publishLocalQuery()}
          onChange={(e) => updateLocalQuery({ files: { path: e.currentTarget.value } })}
        />
      </div>
    </FileBaseQueryModule>
  );
});

export { FileGlobModule };
