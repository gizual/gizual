import { IconFile } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQuery } from "@app/services/local-query";
import { observer } from "mobx-react-lite";

import type { QueryError } from "@giz/maestro";
import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

const QUERY_ID = "files.lastEditedBy";

function getLastEditedByEntry(query: SearchQueryType) {
  if (query.files && "lastEditedBy" in query.files && typeof query.files.lastEditedBy === "string")
    return query.files.lastEditedBy;
  return "";
}

function checkErrors(errors: QueryError[] | undefined) {
  return errors?.some((e) => e.selector === QUERY_ID);
}

const FileLastEditedByModule = observer(() => {
  const { localQuery, updateLocalQuery, publishLocalQuery, errors } = useLocalQuery();
  const value = getLastEditedByEntry(localQuery);

  return (
    <FileBaseQueryModule
      containsErrors={checkErrors(errors)}
      icon={<IconFile />}
      title={"Last edited by"}
      hasSwapButton
      disableItems={["lastEditedBy"]}
      highlightItems={["lastEditedBy"]}
    >
      <div className={style.SpacedChildren}>
        <Input
          error={checkErrors(errors)}
          value={value}
          placeholder="Enter author email"
          onBlur={() => publishLocalQuery()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              publishLocalQuery();
              e.currentTarget.blur();
            }
          }}
          onChange={(e) => updateLocalQuery({ files: { lastEditedBy: e.currentTarget.value } })}
        />
      </div>
    </FileBaseQueryModule>
  );
});

export { FileLastEditedByModule };
