import { IconFile } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQueryCtx } from "@app/utils";

import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

function getLastEditedByEntry(query: SearchQueryType) {
  if (query.files && "lastEditedBy" in query.files && typeof query.files.lastEditedBy === "string")
    return query.files.lastEditedBy;
  return "";
}

export function FileLastEditedByModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
  const value = getLastEditedByEntry(localQuery);

  return (
    <FileBaseQueryModule
      icon={<IconFile />}
      title={"Last edited by:"}
      hasSwapButton
      disableItems={["lastEditedBy"]}
      highlightItems={["lastEditedBy"]}
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
          onChange={(e) => updateLocalQuery({ files: { lastEditedBy: e.currentTarget.value } })}
        />
      </div>
    </FileBaseQueryModule>
  );
}
