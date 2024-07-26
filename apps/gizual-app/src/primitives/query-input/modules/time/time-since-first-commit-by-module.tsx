import { IconClock } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQuery } from "@app/services/local-query";
import { observer } from "mobx-react-lite";

import type { QueryError } from "@giz/maestro";
import { SearchQueryType } from "@giz/query";
import { ViewMode } from "../../shared";
import style from "../modules.module.scss";

import { TimeBaseQueryModule } from "./time-base-module";

const QUERY_ID = "time.sinceFirstCommitBy";

function getSinceFirstCommitByEntry(query: SearchQueryType) {
  if (
    query.time &&
    "sinceFirstCommitBy" in query.time &&
    typeof query.time.sinceFirstCommitBy === "string"
  )
    return query.time.sinceFirstCommitBy;
  return "";
}

function checkErrors(errors: QueryError[] | undefined) {
  return errors?.some((e) => e.selector === QUERY_ID);
}

type TimeSinceFirstCommitByModuleProps = {
  viewMode?: ViewMode;
};

const TimeSinceFirstCommitByModule = observer(
  ({ viewMode = "bar" }: TimeSinceFirstCommitByModuleProps) => {
    const { localQuery, updateLocalQuery, publishLocalQuery, errors } = useLocalQuery();
    const value = getSinceFirstCommitByEntry(localQuery);

    if (viewMode === "modal") {
      return (
        <div className={style.Module__Column}>
          <Input
            error={checkErrors(errors)}
            label="Since first commit by author"
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
          />
        </div>
      );
    }

    return (
      <TimeBaseQueryModule
        containsErrors={checkErrors(errors)}
        icon={<IconClock />}
        title={"Since first commit by"}
        hasSwapButton
        disableItems={["sinceFirstCommitBy"]}
        highlightItems={["sinceFirstCommitBy"]}
      >
        <div className={style.SpacedChildren}>
          <Input
            error={checkErrors(errors)}
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
          />
        </div>
      </TimeBaseQueryModule>
    );
  },
);

export { TimeSinceFirstCommitByModule };
