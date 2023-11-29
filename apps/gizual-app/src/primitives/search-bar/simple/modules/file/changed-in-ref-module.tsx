import { IconFile } from "@app/assets";
import { useLocalQuery } from "@app/utils";
import { Select } from "antd";

import { SearchQueryType } from "@giz/query";
import { SimpleSearchModule } from "../base-module";
import style from "../modules.module.scss";

function getChangedInRefEntry(query: SearchQueryType) {
  if (query.files && "changedInRef" in query.files && !Array.isArray(query.files.changedInRef))
    return query.files.changedInRef;
  return "";
}

export function ChangedInRefModule() {
  const query = useLocalQuery();
  const value = getChangedInRefEntry(query.localQuery);

  return (
    <SimpleSearchModule icon={<IconFile />} title={"Changed in ref:"} hasRemoveIcon>
      <div className={style.SpacedChildren}>
        <Select
          onBlur={() => query.publishLocalQuery()}
          onChange={(e) => query.updateLocalQuery({ files: { path: e } })}
          value={value}
          options={[{ label: "HEAD", value: "HEAD" }]}
          size="small"
        />
      </div>
    </SimpleSearchModule>
  );
}
