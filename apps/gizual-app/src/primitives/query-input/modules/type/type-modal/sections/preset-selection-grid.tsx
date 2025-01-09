import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import { RadioGrid, RadioGridItem } from "@app/primitives/radio-grid";
import { observer } from "mobx-react-lite";
import { match, Pattern } from "ts-pattern";

import { PresetQueryKeys } from "@giz/query";
import { VisTypeViewModel } from "../type-modal.vm";

const StyleRadioTitle: Record<PresetQueryKeys, string> = {
  gradientByAge: "Gradient by Age",
  paletteByAuthor: "Palette by Author",
};

const StyleRadioDescriptions: Record<PresetQueryKeys, string> = {
  gradientByAge: "Colors are assigned based on the age of the line of code.",
  paletteByAuthor: "Colors are assigned based on the author of the line of code.",
};

const PresetSelectionGrid = observer(({ vm }: { vm: VisTypeViewModel }) => {
  const type = vm.selectedType;
  const onChange = (preset: PresetQueryKeys) => {
    vm.setSelectedPreset(preset);
  };

  return (
    <div className={sharedStyle.FlexColumn}>
      {match(type)
        .with(Pattern.union("file-lines", "file-lines-full", "file-mosaic"), () => (
          <RadioGrid>
            <RadioGridItem<PresetQueryKeys>
              checked={vm.selectedPreset === "gradientByAge"}
              value={"gradientByAge"}
              title={StyleRadioTitle["gradientByAge"]}
              description={StyleRadioDescriptions["gradientByAge"]}
              onChange={onChange}
              inputName="style"
            />
            <RadioGridItem<PresetQueryKeys>
              checked={vm.selectedPreset === "paletteByAuthor"}
              value={"paletteByAuthor"}
              title={StyleRadioTitle["paletteByAuthor"]}
              description={StyleRadioDescriptions["paletteByAuthor"]}
              onChange={onChange}
              inputName="style"
            />
          </RadioGrid>
        ))
        .otherwise(() => "TODO: No styles available for this type.")}
    </div>
  );
});

export { PresetSelectionGrid };
