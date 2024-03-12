import { useSettingsController } from "@app/controllers";
import { useTheme } from "@app/hooks/use-theme";
import { RenderedSettingsEntry } from "@app/pages/settings";
import { Button } from "@app/primitives/button";
import { createNumberSetting, createSelectSetting } from "@app/utils/settings";
import { Modal } from "@mantine/core";
import { observer } from "mobx-react-lite";
import React from "react";

type ContextModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: (o: boolean) => void;
};

const ContextModal = observer(({ isModalOpen, setIsModalOpen }: ContextModalProps) => {
  const settingsController = useSettingsController();

  const handleOk = React.useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const handleCancel = React.useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const currentTheme = useTheme();
  const [selectedAppearance, setSelectedAppearance] = React.useState(currentTheme);
  const numColsDefault =
    settingsController.settings.visualizationSettings.canvas.masonryColumns.defaultValue;
  const [numCols, setNumCols] = React.useState(numColsDefault);

  return (
    <Modal title="Export to SVG" opened={isModalOpen} onClose={handleCancel} onAbort={handleCancel}>
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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "1rem",
          paddingTop: "1rem",
        }}
      >
        <Button variant="gray" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleOk}>Export</Button>
      </div>
    </Modal>
  );
});

export { ContextModal };
