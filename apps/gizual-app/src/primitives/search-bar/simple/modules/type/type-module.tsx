import { IconSettingsOutline } from "@app/assets";

import { useQuery } from "@giz/maestro/react";
import { SearchQueryType } from "@giz/query";
import { SimpleSearchModule } from "../base-module";
import style from "../modules.module.scss";

function getTypeEntry(query: SearchQueryType) {
  if (query.type) return query.type;
  return "";
}

export function TypeModule() {
  const { query, updateQuery } = useQuery();
  const value = getTypeEntry(query);

  return (
    <SimpleSearchModule
      icon={<IconSettingsOutline />}
      title={"Type:"}
      hasRemoveIcon
      onRemove={() => {
        updateQuery({ type: undefined });
      }}
    >
      <div className={style.SpacedChildren}>{value}</div>
    </SimpleSearchModule>
  );
}
