import { IconFile } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQueryCtx } from "@app/utils";

import type { QueryError } from "@giz/maestro";
import { SearchQueryType } from "@giz/query";
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

export function FileChangedInRefModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery, errors } = useLocalQueryCtx();
  const value = getChangedInRefEntry(localQuery);

  return (
    <FileBaseQueryModule
      containsErrors={checkErrors(errors)}
      icon={<IconFile />}
      title={"Changed in revision:"}
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
          style={{ width: 150 }}
        />
      </div>
    </FileBaseQueryModule>
  );
}
