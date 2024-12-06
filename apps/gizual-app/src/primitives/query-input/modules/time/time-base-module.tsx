import { observer } from "mobx-react-lite";

import { useQuery } from "@giz/maestro/react";

import { BaseQueryModule, BaseQueryModuleProps } from "..";
import { TimeMenuItems } from "./time-menu";

export type TimeBaseQueryModuleProps = {
  disableItems?: string[];
  highlightItems?: string[];
} & BaseQueryModuleProps;

const TimeBaseQueryModule = observer(
  ({ disableItems, highlightItems, ...props }: TimeBaseQueryModuleProps) => {
    const query = useQuery();
    return (
      <BaseQueryModule
        section="Time"
        {...props}
        menuItems={
          <TimeMenuItems
            query={query}
            disableItems={disableItems}
            highlightItems={highlightItems}
            hideItems={["sinceFirstCommitBy"]}
          />
        }
      />
    );
  },
);

export { TimeBaseQueryModule };
