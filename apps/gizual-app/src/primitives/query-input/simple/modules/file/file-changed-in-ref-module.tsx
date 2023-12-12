import { IconFile } from "@app/assets";
import { useLocalQueryCtx } from "@app/utils";
import { Select } from "antd";

import { SearchQueryType } from "@giz/query";
import { BaseQueryModule } from "../base-query-module";
import style from "../modules.module.scss";

function getChangedInRefEntry(query: SearchQueryType) {
  if (query.files && "changedInRef" in query.files && !Array.isArray(query.files.changedInRef))
    return query.files.changedInRef;
  return "";
}

export function FileChangedInRefModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
  const value = getChangedInRefEntry(localQuery);

  return (
    <BaseQueryModule
      icon={<IconFile />}
      title={"Changed in ref:"}
      hasRemoveIcon
      onRemove={() => {
        updateLocalQuery({ files: undefined });
        publishLocalQuery();
      }}
    >
      <div className={style.SpacedChildren}>
        <Select
          onBlur={() => publishLocalQuery()}
          onChange={(e) => updateLocalQuery({ files: { path: e } })}
          value={value}
          options={[{ label: "HEAD", value: "HEAD" }]}
          size="small"
          style={{ minWidth: 80 }}
        />
      </div>
    </BaseQueryModule>
  );
}
