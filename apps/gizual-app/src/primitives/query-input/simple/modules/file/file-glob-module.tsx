import { IconFile } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQueryCtx } from "@app/utils";

import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

function getGlobEntry(query: SearchQueryType) {
  if (query.files && "path" in query.files && !Array.isArray(query.files.path))
    return query.files.path;
  return "";
}

export function FileGlobModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
  const value = getGlobEntry(localQuery);

  return (
    <FileBaseQueryModule
      icon={<IconFile />}
      title={"Pattern:"}
      hasSwapButton
      disableItems={["pattern"]}
      highlightItems={["pattern"]}
    >
      <div className={style.SpacedChildren}>
        <Input
          value={value}
          placeholder="Example: *.tsx"
          onBlur={() => publishLocalQuery()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              publishLocalQuery();
              e.currentTarget.blur();
            }
          }}
          onChange={(e) => updateLocalQuery({ files: { path: e.currentTarget.value } })}
        />
      </div>
    </FileBaseQueryModule>
  );
}
