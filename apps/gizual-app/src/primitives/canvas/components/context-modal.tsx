import { useSettingsController } from "@app/controllers";
import { RenderedSettingsEntry } from "@app/pages/settings";
import { useTheme } from "@app/utils/hooks";
import { createNumberSetting, createSelectSetting } from "@app/utils/settings";
import { Modal } from "@mantine/core";
import { observer } from "mobx-react-lite";
import React from "react";

import { CanvasViewModel } from "../canvas.vm";

type ContextModalProps = {
  vm: CanvasViewModel;
  isModalOpen: boolean;
  setIsModalOpen: (o: boolean) => void;
};

const ContextModal = observer(({ vm, isModalOpen, setIsModalOpen }: ContextModalProps) => {
  const handleOk = React.useCallback(() => {
    setIsModalOpen(false);
    vm.drawSvg(numCols, selectedAppearance);
  }, [setIsModalOpen]);

  const handleCancel = React.useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const currentTheme = useTheme();
  const settingsController = useSettingsController();
  const [selectedAppearance, setSelectedAppearance] = React.useState(currentTheme);
  const numColsDefault =
    settingsController.settings.visualizationSettings.canvas.masonryColumns.defaultValue;
  const [numCols, setNumCols] = React.useState(numColsDefault);

  return (
    <Modal title="Export to SVG" opened={isModalOpen} onClose={handleOk} onAbort={handleCancel}>
      <RenderedSettingsEntry
        entry={createNumberSetting(
          "Columns",
          "The amount of columns to use for the exported SVG. (default = 10)",
          numCols,
        )}
        onChange={(e: any) => setNumCols(e.target.value)}
        onResetToDefault={() => setNumCols(numColsDefault)}
        isDefault={() => numCols === numColsDefault}
      />
      <RenderedSettingsEntry
        entry={createSelectSetting(
          "Appearance",
          "Controls the background and font colors of the exported SVG.",
          selectedAppearance,
          [
            { value: "dark", label: "Light text on dark background" },
            { value: "light", label: "Dark text on light background" },
          ],
        )}
        onChange={setSelectedAppearance}
        onResetToDefault={() => setSelectedAppearance(currentTheme)}
        isDefault={() => selectedAppearance === currentTheme}
      />
    </Modal>
  );
});

export { ContextModal };
