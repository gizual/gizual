import { IconClock } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQueryCtx } from "@app/utils";

import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { TimeBaseQueryModule } from "./time-base-module";

function getSinceFirstCommitByEntry(query: SearchQueryType) {
  if (
    query.time &&
    "sinceFirstCommitBy" in query.time &&
    typeof query.time.sinceFirstCommitBy === "string"
  )
    return query.time.sinceFirstCommitBy;
  return "";
}

export function TimeSinceFirstCommitByModule() {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
  const value = getSinceFirstCommitByEntry(localQuery);

  return (
    <TimeBaseQueryModule
      icon={<IconClock />}
      title={"Since first commit by:"}
      hasSwapButton
      disableItems={["sinceFirstCommitBy"]}
      highlightItems={["sinceFirstCommitBy"]}
    >
      <div className={style.SpacedChildren}>
        <Input
          value={value}
          placeholder="Enter author email"
          onBlur={() => publishLocalQuery()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              publishLocalQuery();
              e.currentTarget.blur();
            }
          }}
          onChange={(e) =>
            updateLocalQuery({ time: { sinceFirstCommitBy: e.currentTarget.value } })
          }
          style={{ width: 200 }}
        />
      </div>
    </TimeBaseQueryModule>
  );
}
