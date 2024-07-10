import { IconInfo, IconSettingsOutline } from "@app/assets";
import { useMainController } from "@app/controllers";
import { Button } from "@app/primitives/button";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { useViewModel } from "@app/services/view-model";
import { Tooltip } from "@mantine/core";
import { observer } from "mobx-react-lite";

import { useQuery } from "@giz/maestro/react";
import { SearchQueryType } from "@giz/query";
import { ViewMode } from "../../shared";
import style from "../modules.module.scss";

import { TypePlaceholderModal } from "./type-modal/type-modal";
import { VisTypeViewModel } from "./type-modal/type-modal.vm";

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
  const vm = useViewModel(VisTypeViewModel);

  const mainController = useMainController();
  const isOpen = mainController.isVisTypeModalOpen;
  const setIsOpen = mainController.setVisTypeModalOpen;

  if (viewMode === "modal") {
    return <TypePlaceholderModal vm={vm} />;
  }

  return (
    <div className={style.BaseQueryModule}>
      <div className={style.ColumnContainer}>
        <div className={style.QueryModuleHeader}>
          <div className={style.QueryModuleIconWithText}>
            <div className={style.QueryModuleIcon}>
              <IconSettingsOutline />
            </div>
            <div className={style.QueryModuleTitle}>Vis</div>
          </div>

          <Tooltip label={"Select the desired visualisation type with this module."} withArrow>
            <div>
              <IconInfo className={style.QueryModuleIcon} />
            </div>
          </Tooltip>
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
            defaultFooterOpts={{
              cancelLabel: "Discard",
              okLabel: "Apply",
              hasOk: true,
              hasCancel: true,
              onOk: () => {
                vm.apply();
                setIsOpen(false);
              },
              onCancel: () => {
                setIsOpen(false);
              },
            }}
            withFooter
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
            <TypePlaceholderModal vm={vm} withSplitPreview />
          </DialogProvider>
        </div>
      </div>
    </div>
  );
}

const ObserverTypeModuleComponent = observer(TypeModuleComponent);

export { ObserverTypeModuleComponent as TypeModuleComponent };
