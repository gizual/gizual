import { IconFile } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQueryCtx } from "@app/utils";

import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

function getCreatedByEntry(query: SearchQueryType) {
  if (query.files && "createdBy" in query.files && typeof query.files.createdBy === "string")
    return query.files.createdBy;
  return "";
}

export function FileCreatedByModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
  const value = getCreatedByEntry(localQuery);

  return (
    <FileBaseQueryModule
      icon={<IconFile />}
      title={"Created by:"}
      hasSwapButton
      disableItems={["createdBy"]}
      highlightItems={["createdBy"]}
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
          onChange={(e) => updateLocalQuery({ files: { createdBy: e.currentTarget.value } })}
        />
      </div>
    </FileBaseQueryModule>
  );
}
