import { AuthorTable } from "@app/primitives/author-panel";
import { ColorPicker } from "@app/primitives/color-picker";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import style from "../../../modules.module.scss";
import { VisTypeViewModel } from "../type-modal.vm";

const GradientColorCustomization = observer(({ vm }: { vm: VisTypeViewModel }) => {
  const selectedColors = vm.queryGradientColorsWithFallback;
  const onChange = (colors: string[]) => {
    vm.setGradientColors(colors);
  };

  return (
    <div className={style.GradientColorCustomization}>
      <div className={style.GradientColorCustomizationRow}>
        <ColorPicker
          hexValue={selectedColors[0]}
          onAccept={(c) => {
            selectedColors[0] = c;
            onChange([...selectedColors]);
          }}
        />
        <p className={style.GradientColorTitle}>Oldest Change</p>
      </div>

      <div className={style.GradientColorCustomizationRow}>
        <ColorPicker
          hexValue={selectedColors[1]}
          onAccept={(c) => {
            selectedColors[1] = c;
            onChange([...selectedColors]);
          }}
        />
        <p className={style.GradientColorTitle}>Newest Change</p>
      </div>
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
