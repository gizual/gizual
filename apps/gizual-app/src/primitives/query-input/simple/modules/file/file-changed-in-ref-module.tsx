import { IconFile } from "@app/assets";
import { Select } from "@app/primitives/select";
import { useLocalQueryCtx } from "@app/utils";

import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

function getChangedInRefEntry(query: SearchQueryType) {
  if (query.files && "changedInRef" in query.files && !Array.isArray(query.files.changedInRef))
    return query.files.changedInRef;
  return "";
}

export function FileChangedInRefModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
  const value = getChangedInRefEntry(localQuery);

  return (
    <FileBaseQueryModule
      icon={<IconFile />}
      title={"Changed in revision:"}
      hasSwapButton
      disableItems={["changedInRef"]}
      highlightItems={["changedInRef"]}
      hasHelpTooltip
      helpContent="Enter a valid git revision to search for. Example: HEAD, master, origin/master, etc."
    >
      <div className={style.SpacedChildren}>
        <Select
          onBlur={() => publishLocalQuery()}
          onChange={(e) => updateLocalQuery({ files: { path: e ?? "" } })}
          value={value}
          data={[{ label: "HEAD", value: "HEAD" }]}
          style={{ width: 80 }}
        />
      </div>
    </FileBaseQueryModule>
  );
}
