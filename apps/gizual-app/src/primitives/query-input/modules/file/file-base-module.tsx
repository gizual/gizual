import { observer } from "mobx-react-lite";
import React from "react";

import { useQuery } from "@giz/maestro/react";

import { BaseQueryModule, BaseQueryModuleProps } from "..";
import { FileMenuItems } from "./file-menu";

export type FileBaseQueryModuleProps = {
  hasHelpTooltip?: boolean;
  helpContent?: string;
  disableItems?: string[];
  highlightItems?: string[];
} & BaseQueryModuleProps;

export const FileBaseQueryModule = observer(
  ({
    hasHelpTooltip,
    helpContent,
    disableItems,
    highlightItems,
    ...props
  }: FileBaseQueryModuleProps) => {
    const query = useQuery();
    return (
      <BaseQueryModule
        hasHelpTooltip={hasHelpTooltip}
        helpContent={helpContent}
        section="File"
        {...props}
        menuItems={
          <FileMenuItems
            query={query}
            disableItems={disableItems}
            highlightItems={highlightItems}
            hideItems={["lastEditedBy", "editedBy", "createdBy", "contains"]}
          />
        }
      />
    );
  },
);
