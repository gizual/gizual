import { IconFile } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQueryCtx } from "@app/utils";

import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

function getContainsEntry(query: SearchQueryType) {
  if (query.files && "contains" in query.files) return query.files.contains;
  return "";
}

export function FileContainsModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
  const value = getContainsEntry(localQuery);

  return (
    <FileBaseQueryModule
      icon={<IconFile />}
      title={"Contains:"}
      hasSwapButton
      disableItems={["contains"]}
      highlightItems={["contains"]}
    >
      <div className={style.SpacedChildren}>
        <Input
          value={value}
          placeholder="TODO"
          onBlur={() => publishLocalQuery()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              publishLocalQuery();
              e.currentTarget.blur();
            }
          }}
          onChange={(e) => updateLocalQuery({ files: { contains: e.target.value } })}
        />
      </div>
    </FileBaseQueryModule>
  );
}
