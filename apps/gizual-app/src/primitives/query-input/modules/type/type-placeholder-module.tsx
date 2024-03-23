import { IconSettingsOutline } from "@app/assets";
import { DialogProvider } from "@app/primitives/dialog-provider";
import React from "react";

import { PlaceholderQueryModule } from "../base-query-module";
import style from "../modules.module.scss";

import { TypePlaceholderModal } from "./type-modal/type-modal";

export function TypePlaceholderModule() {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <DialogProvider
      trigger={
        <PlaceholderQueryModule
          icon={<IconSettingsOutline />}
          title={"Choose a visualization type."}
          accentColor="#237600"
          onClick={() => {
            setIsOpen(true);
          }}
        />
      }
      title="Choose visualization type"
      triggerClassName={style.PlaceholderQueryModuleTrigger}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
    >
      <TypePlaceholderModal closeModal={() => setIsOpen(false)} />
    </DialogProvider>
  );
}
