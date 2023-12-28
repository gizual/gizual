import React from "react";

import { useQuery } from "@giz/maestro/react";

import { BaseQueryModule, BaseQueryModuleProps } from "..";
import { FileMenuItems } from "./file-menu";

export type FileBaseQueryModuleProps = {
  disableItems?: string[];
  highlightItems?: string[];
} & BaseQueryModuleProps;

export const FileBaseQueryModule = React.memo(
  ({ disableItems, highlightItems, ...props }: FileBaseQueryModuleProps) => {
    const query = useQuery();
    return (
      <BaseQueryModule
        {...props}
        menuItems={
          <FileMenuItems
            query={query}
            disableItems={disableItems}
            highlightItems={highlightItems}
          />
        }
      />
    );
  },
);
