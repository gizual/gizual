import { IconFile } from "@app/assets";
import { useLocalQuery } from "@app/utils";
import { Input } from "antd";

import { SearchQueryType } from "@giz/query";
import { SimpleSearchModule } from "../base-module";
import style from "../modules.module.scss";

function getGlobEntry(query: SearchQueryType) {
  if (query.files && "path" in query.files && !Array.isArray(query.files.path))
    return query.files.path;
  return "";
}

export function GlobModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQuery();
  const value = getGlobEntry(localQuery);

  return (
    <SimpleSearchModule icon={<IconFile />} title={"Pattern:"} hasRemoveIcon>
      <div className={style.SpacedChildren}>
        <Input
          onBlur={() => publishLocalQuery()}
          onChange={(e) => updateLocalQuery({ files: { path: e.currentTarget.value } })}
          value={value}
          size="small"
        />
      </div>
    </SimpleSearchModule>
  );
}
