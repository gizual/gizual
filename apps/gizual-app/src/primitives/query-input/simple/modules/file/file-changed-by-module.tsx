import { IconFile } from "@app/assets";
import { useLocalQueryCtx } from "@app/utils";
import { Input } from "@mantine/core";

import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

function getChangedByEntry(query: SearchQueryType) {
  if (query.files && "changedBy" in query.files && typeof query.files.changedBy === "string")
    return query.files.changedBy;
  return "";
}

export function FileChangedByModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
  const value = getChangedByEntry(localQuery);

  return (
    <FileBaseQueryModule
      icon={<IconFile />}
      title={"Changed by:"}
      hasSwapButton
      disableItems={["changedByAuthor"]}
      highlightItems={["changedByAuthor"]}
    >
      <div className={style.SpacedChildren}>
        <Input
          value={value}
          size="small"
          placeholder="Enter a name or email address"
          onBlur={() => publishLocalQuery()}
          onChange={(e) => updateLocalQuery({ files: { path: e.currentTarget.value } })}
        />
      </div>
    </FileBaseQueryModule>
  );
}
