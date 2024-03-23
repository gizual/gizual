import { IconEdit, IconSettingsOutline } from "@app/assets";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { IconButton } from "@app/primitives/icon-button";
import { observer } from "mobx-react-lite";
import React from "react";

import { useQuery } from "@giz/maestro/react";
import { SearchQueryType } from "@giz/query";
import { BaseQueryModule } from "../base-query-module";
import style from "../modules.module.scss";

import { TypePlaceholderModal } from "./type-modal/type-modal";

function getTypeEntry(query: SearchQueryType) {
  if (query.type) return query.type;
  return "";
}

function TypeModuleComponent() {
  const { query } = useQuery();
  const value = getTypeEntry(query);
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <BaseQueryModule
      icon={<IconSettingsOutline />}
      title={"Vis:"}
      hasEditButton
      editButtonComponent={
        <DialogProvider
          trigger={
            <IconButton>
              <IconEdit className={style.CloseIcon} />
            </IconButton>
          }
          title="Swap Visualization Type"
          triggerClassName={style.PlaceholderQueryModuleTrigger}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          contentStyle={{ overflow: "hidden" }}
        >
          <TypePlaceholderModal closeModal={() => setIsOpen(false)} />
        </DialogProvider>
      }
    >
      <div className={style.SpacedChildren}>{value}</div>
    </BaseQueryModule>
  );
}

const ObserverTypeModuleComponent = observer(TypeModuleComponent);

export { ObserverTypeModuleComponent as TypeModuleComponent };