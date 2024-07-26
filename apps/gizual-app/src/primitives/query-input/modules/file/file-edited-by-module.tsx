import { IconFile } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQuery } from "@app/services/local-query";
import { observer } from "mobx-react-lite";

import type { QueryError } from "@giz/maestro";
import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

const QUERY_ID = "files.editedBy";

function getEditedByEntry(query: SearchQueryType) {
  if (query.files && "editedBy" in query.files && typeof query.files.editedBy === "string")
    return query.files.editedBy;
  return "";
}

function checkErrors(errors: QueryError[] | undefined) {
  return errors?.some((e) => e.selector === QUERY_ID);
}

const FileEditedByModule = observer(() => {
  const { localQuery, updateLocalQuery, publishLocalQuery, errors } = useLocalQuery();
  const value = getEditedByEntry(localQuery);

  return (
    <FileBaseQueryModule
      containsErrors={checkErrors(errors)}
      icon={<IconFile />}
      title={"Edited by"}
      hasSwapButton
      disableItems={["editedBy"]}
      highlightItems={["editedBy"]}
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
          onChange={(e) => updateLocalQuery({ files: { editedBy: e.currentTarget.value } })}
        />
      </div>
    </FileBaseQueryModule>
  );
});

export { FileEditedByModule };
