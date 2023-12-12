import { IconFile } from "@app/assets";
import { useLocalQueryCtx } from "@app/utils";
import { Input } from "antd";

import { SearchQueryType } from "@giz/query";
import { BaseQueryModule } from "../base-query-module";
import style from "../modules.module.scss";

function getGlobEntry(query: SearchQueryType) {
  if (query.files && "path" in query.files && !Array.isArray(query.files.path))
    return query.files.path;
  return "";
}

export function FileGlobModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
  const value = getGlobEntry(localQuery);

  return (
    <BaseQueryModule
      icon={<IconFile />}
      title={"Pattern:"}
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
          placeholder="Example: *.tsx"
          onBlur={() => publishLocalQuery()}
          onChange={(e) => updateLocalQuery({ files: { path: e.currentTarget.value } })}
          onPressEnter={(e) => e.currentTarget.blur()}
        />
      </div>
    </BaseQueryModule>
  );
}
