import { AuthorTable } from "@app/primitives/author-panel";
import { ColorPicker } from "@app/primitives/color-picker";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import { VisTypeViewModel } from "../type-modal.vm";

const GradientColorCustomization = observer(({ vm }: { vm: VisTypeViewModel }) => {
  const selectedColors = vm.queryGradientColorsWithFallback;
  const onChange = (colors: string[]) => {
    vm.setGradientColors(colors);
  };

  return (
    <div className={clsx(sharedStyle.FlexRow, sharedStyle["Gap-4"])}>
      {selectedColors &&
        selectedColors.length > 0 &&
        selectedColors.map((color, index) => (
          <div
            className={clsx(sharedStyle.FlexRow, sharedStyle["Gap-1"], sharedStyle["Items-Center"])}
            key={index}
          >
            <p className={sharedStyle["Text-Base"]}>
              Color {index === 0 ? "(Start date)" : "(End date)"}:
            </p>
            <ColorPicker
              hexValue={color}
              onAccept={(c) => {
                selectedColors[index] = c;
                onChange([...selectedColors]);
              }}
            />
          </div>
        ))}
      {!selectedColors ||
        (selectedColors.length === 0 && (
          <div>Open TODO: This selection does not allow for additional color customization.</div>
        ))}
    </div>
  );
});

const AuthorColorCustomization = observer(() => {
  return (
    <>
      <div
        className={clsx(sharedStyle.FlexColumn, sharedStyle["Gap-1"])}
        style={{
          justifyContent: "center",
          alignItems: "left",
        }}
      >
        <AuthorTable id="vis-type-modal-authors" noPublish />
      </div>
    </>
  );
});

export { AuthorColorCustomization, GradientColorCustomization };
