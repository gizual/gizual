import { IconEdit, IconSettingsOutline } from "@app/assets";
import { Button } from "@app/primitives/button";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { observer } from "mobx-react-lite";
import React from "react";

import { useQuery } from "@giz/maestro/react";
import { SearchQueryType } from "@giz/query";
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
    <DialogProvider
      title="Swap Visualization Type"
      contentStyle={{ overflow: "hidden" }}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      triggerClassName={style.BaseQueryModule}
      triggerStyle={{ padding: 0, border: 0 }}
      trigger={
        <Button aria-expanded={isOpen} variant="secondary" className={style.TypeButton}>
          <div className={style.QueryModuleIconWithText}>
            <div className={style.QueryModuleIcon}>
              <IconSettingsOutline />
            </div>
            <div className={style.QueryModuleTitle}>Vis:</div>
            {value}
            <IconEdit className={style.CloseIcon} />
          </div>
        </Button>
      }
    >
      <TypePlaceholderModal closeModal={() => setIsOpen(false)} />
    </DialogProvider>
  );
}

const ObserverTypeModuleComponent = observer(TypeModuleComponent);

export { ObserverTypeModuleComponent as TypeModuleComponent };
