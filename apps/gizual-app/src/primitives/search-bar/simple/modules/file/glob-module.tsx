import { IconFile } from "@app/assets";
import { Input } from "antd";

import { useQuery } from "@giz/maestro/react";
import { SimpleSearchModule } from "../base-module";
import style from "../modules.module.scss";

export function GlobModule() {
  const query = useQuery();
  let moduleValue = "";
  if (query.query.files && "path" in query.query.files && !Array.isArray(query.query.files.path))
    moduleValue = query.query.files.path;

  return (
    <SimpleSearchModule icon={<IconFile />} title={"Pattern:"} hasRemoveIcon>
      <div className={style.SpacedChildren}>
        <Input
          onBlur={(e) => query.updateQuery({ files: { path: e.currentTarget.value } })}
          defaultValue={moduleValue}
          size="small"
        />
      </div>
    </SimpleSearchModule>
  );
}
