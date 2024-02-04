import { IconClock } from "@app/assets";
import { Input } from "@app/primitives/input";
import { useLocalQueryCtx } from "@app/utils/hooks";
import { observer } from "mobx-react-lite";

import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { TimeBaseQueryModule } from "./time-base-module";

function getTimeRangeByRefEntry(query: SearchQueryType) {
  if (query.time && "rangeByRef" in query.time) {
    if (Array.isArray(query.time.rangeByRef))
      return { from: query.time.rangeByRef[0], to: query.time.rangeByRef[1] };

    return { from: query.time.rangeByRef, to: "" };
  }
  return { from: "", to: "" };
}

export const TimeRangeByRefModule = observer(() => {
  const { localQuery, publishLocalQuery, updateLocalQuery } = useLocalQueryCtx();
  const { from, to } = getTimeRangeByRefEntry(localQuery);

  const onChangeStartRef = (ref: string) => {
    updateLocalQuery({
      time: {
        rangeByRef: [ref, to],
      },
    });
  };

  const onChangeEndRef = (ref: string) => {
    updateLocalQuery({
      time: {
        rangeByRef: [from, ref],
      },
    });
  };

  return (
    <TimeBaseQueryModule
      icon={<IconClock />}
      title={"Range by revision:"}
      hasSwapButton
      disableItems={["rangeByRef"]}
      highlightItems={["rangeByRef"]}
    >
      <div className={style.SpacedChildren}>
        From:
        <Input
          onBlur={() => publishLocalQuery()}
          onChange={(e) => onChangeStartRef(e.currentTarget.value)}
          value={from}
          style={{ width: 120 }}
        />
        To:
        <Input
          onBlur={() => publishLocalQuery()}
          onChange={(e) => onChangeEndRef(e.currentTarget.value)}
          value={to}
          style={{ width: 120 }}
        />
      </div>
    </TimeBaseQueryModule>
  );
});
