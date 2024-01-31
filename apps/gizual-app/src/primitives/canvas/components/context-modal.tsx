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
  selectedWidth: number;
  setSelectedWidth: (n: number) => void;
};

const ContextModal = observer(
  ({ vm, isModalOpen, setIsModalOpen, selectedWidth, setSelectedWidth }: ContextModalProps) => {
    const handleOk = React.useCallback(() => {
      setIsModalOpen(false);
      vm.drawSvg(selectedWidth, selectedAppearance);
    }, [setIsModalOpen]);

    const handleCancel = React.useCallback(() => {
      setIsModalOpen(false);
    }, [setIsModalOpen]);

    const currentTheme = useTheme();
    const [selectedAppearance, setSelectedAppearance] = React.useState(currentTheme);
    return (
      <Modal title="Export to SVG" opened={isModalOpen} onClose={handleOk} onAbort={handleCancel}>
        <RenderedSettingsEntry
          entry={createNumberSetting(
            "View-box width",
            "The width of the SVG view-box. Influences the number of columns within the grid.",
            selectedWidth,
          )}
          onChange={setSelectedWidth}
          onResetToDefault={() => setSelectedWidth(vm.canvasWidth)}
          isDefault={() => selectedWidth === vm.canvasWidth}
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
  },
);

export { ContextModal };
