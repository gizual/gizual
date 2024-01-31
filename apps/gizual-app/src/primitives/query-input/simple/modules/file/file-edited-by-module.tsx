import { IconFile } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQueryCtx } from "@app/utils";

import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

function getEditedByEntry(query: SearchQueryType) {
  if (query.files && "editedBy" in query.files && typeof query.files.editedBy === "string")
    return query.files.editedBy;
  return "";
}

export function FileEditedByModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
  const value = getEditedByEntry(localQuery);

  return (
    <FileBaseQueryModule
      icon={<IconFile />}
      title={"Edited by:"}
      hasSwapButton
      disableItems={["editedBy"]}
      highlightItems={["editedBy"]}
    >
      <div className={style.SpacedChildren}>
        <Input
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
}
