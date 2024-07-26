import { IconSettingsOutline } from "@app/assets";
import { useMainController } from "@app/controllers";
import { Button } from "@app/primitives/button";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { observer } from "mobx-react-lite";

import { useQuery } from "@giz/maestro/react";
import { SearchQueryType } from "@giz/query";
import { ViewMode } from "../../shared";
import style from "../modules.module.scss";

import { TypePlaceholderModal } from "./type-modal/type-modal";

function getTypeEntry(query: SearchQueryType) {
  if (query.type) return query.type;
  return "";
}

type TypeModuleComponentProps = {
  viewMode?: ViewMode;
};

function TypeModuleComponent({ viewMode }: TypeModuleComponentProps) {
  const { query } = useQuery();
  const value = getTypeEntry(query);

  const mainController = useMainController();
  const isOpen = mainController.isVisTypeModalOpen;
  const setIsOpen = mainController.setVisTypeModalOpen;

  if (viewMode === "modal") {
    return <TypePlaceholderModal />;
  }

  return (
    <div className={style.BaseQueryModule}>
      <div className={style.ColumnContainer}>
        <div className={style.QueryModuleIconWithText}>
          <div className={style.QueryModuleIcon}>
            <IconSettingsOutline />
          </div>
          <div className={style.QueryModuleTitle}>Vis</div>
        </div>

        <div className={style.RowContainer}>
          <DialogProvider
            title="Change Visualization Type"
            contentStyle={{ overflow: "hidden" }}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            triggerClassName={style.BaseQueryModule}
            triggerStyle={{ padding: 0, border: 0 }}
            contentClassName={style.TypeModalContainer}
            trigger={
              <Button
                aria-expanded={isOpen}
                variant="secondary"
                className={style.TypeButton}
                style={{ minWidth: 150 }}
              >
                {value}
              </Button>
            }
          >
            <TypePlaceholderModal closeModal={() => setIsOpen(false)} withSplitPreview />
          </DialogProvider>
        </div>
      </div>
    </div>
  );
}

const ObserverTypeModuleComponent = observer(TypeModuleComponent);

export { ObserverTypeModuleComponent as TypeModuleComponent };
