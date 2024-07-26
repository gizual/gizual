import { IconFile } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQuery } from "@app/services/local-query";
import { observer } from "mobx-react-lite";

import type { QueryError } from "@giz/maestro";
import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

const QUERY_ID = "files.contains";

function getContainsEntry(query: SearchQueryType) {
  if (query.files && "contains" in query.files) return query.files.contains;
  return "";
}

function checkErrors(errors: QueryError[] | undefined) {
  return errors?.some((e) => e.selector === QUERY_ID);
}

const FileContainsModule = observer(() => {
  const { localQuery, updateLocalQuery, publishLocalQuery, errors } = useLocalQuery();
  const value = getContainsEntry(localQuery);

  return (
    <FileBaseQueryModule
      containsErrors={checkErrors(errors)}
      icon={<IconFile />}
      title={"Contains"}
      hasSwapButton
      disableItems={["contains"]}
      highlightItems={["contains"]}
    >
      <div className={style.SpacedChildren}>
        <Input
          error={checkErrors(errors)}
          value={value}
          placeholder="TODO"
          onBlur={() => publishLocalQuery()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              publishLocalQuery();
              e.currentTarget.blur();
            }
          }}
          onChange={(e) => updateLocalQuery({ files: { contains: e.target.value } })}
        />
      </div>
    </FileBaseQueryModule>
  );
});

export { FileContainsModule };
