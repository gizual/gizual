import { IconFile } from "@app/assets";
import { useLocalQueryCtx } from "@app/utils";
import { Input } from "antd";

import { SearchQueryType } from "@giz/query";
import { BaseQueryModule } from "../base-query-module";
import style from "../modules.module.scss";

function getChangedByEntry(query: SearchQueryType) {
  if (query.files && "changedBy" in query.files && typeof query.files.changedBy === "string")
    return query.files.changedBy;
  return "";
}

export function FileChangedByModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
  const value = getChangedByEntry(localQuery);

  return (
    <BaseQueryModule
      icon={<IconFile />}
      title={"Changed by:"}
      hasRemoveIcon
      onRemove={() => {
        updateLocalQuery({ files: undefined });
        publishLocalQuery();
      }}
    >
      <div className={style.SpacedChildren}>
        <Input
          value={value}
          size="small"
          placeholder="Enter a name or email address"
          onBlur={() => publishLocalQuery()}
          onChange={(e) => updateLocalQuery({ files: { path: e.currentTarget.value } })}
          onPressEnter={(e) => e.currentTarget.blur()}
        />
      </div>
    </BaseQueryModule>
  );
}
