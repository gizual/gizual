import { IconFile } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQueryCtx } from "@app/utils";

import type { QueryError } from "@giz/maestro";
import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

const QUERY_ID = "files.createdBy";

function getCreatedByEntry(query: SearchQueryType) {
  if (query.files && "createdBy" in query.files && typeof query.files.createdBy === "string")
    return query.files.createdBy;
  return "";
}

function checkErrors(errors: QueryError[] | undefined) {
  return errors?.some((e) => e.selector === QUERY_ID);
}

export function FileCreatedByModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery, errors } = useLocalQueryCtx();
  const value = getCreatedByEntry(localQuery);

  return (
    <FileBaseQueryModule
      containsErrors={checkErrors(errors)}
      icon={<IconFile />}
      title={"Created by:"}
      hasSwapButton
      disableItems={["createdBy"]}
      highlightItems={["createdBy"]}
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
          onChange={(e) => updateLocalQuery({ files: { createdBy: e.currentTarget.value } })}
        />
      </div>
    </FileBaseQueryModule>
  );
}
