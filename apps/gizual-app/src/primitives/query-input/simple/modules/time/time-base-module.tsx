import { observer } from "mobx-react-lite";
import React from "react";

import { useQuery } from "@giz/maestro/react";

import { BaseQueryModule, BaseQueryModuleProps } from "..";
import { TimeMenuItems } from "./time-menu";

export type TimeBaseQueryModuleProps = {
  disableItems?: string[];
  highlightItems?: string[];
} & BaseQueryModuleProps;

export const TimeBaseQueryModule = observer(
  ({ disableItems, highlightItems, ...props }: TimeBaseQueryModuleProps) => {
    const query = useQuery();
    return (
      <BaseQueryModule
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
