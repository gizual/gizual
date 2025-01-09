import { observer } from "mobx-react-lite";
import React from "react";

import style from "../../modules.module.scss";

import {
  AuthorColorCustomization,
  GradientColorCustomization,
} from "./sections/color-customization";
import { PresetSelectionGrid } from "./sections/preset-selection-grid";
import { VisTypePreview } from "./sections/type-preview";
import { TypeSelectionGrid } from "./sections/type-selection-grid";
import { VisTypeViewModel } from "./type-modal.vm";

type TypePlaceholderModalProps = {
  onApply?: () => void;
  vm: VisTypeViewModel;
  withSplitPreview?: boolean;
};

const TypePlaceholderModal = observer(({ withSplitPreview, vm }: TypePlaceholderModalProps) => {
  const sections: { title: string; children: React.ReactNode }[] = [
    {
      title: "Select Visualization Type",
      children: <TypeSelectionGrid vm={vm} />,
    },
    {
      title: "Select Visual Encoding",
      children: <PresetSelectionGrid vm={vm} />,
    },
    {
      title: "Customize Visual Encoding",
      children: (
        <>
          {vm.selectedPreset === "gradientByAge" && <GradientColorCustomization vm={vm} />}
          {vm.selectedPreset === "paletteByAuthor" && <AuthorColorCustomization />}
        </>
      ),
    },
  ];

  return (
    <div className={style.TypeDialog}>
      <div className={style.TypeDialogSplit} style={withSplitPreview ? {} : { gap: 0, padding: 0 }}>
        <div className={style.TypeDialog__Left}>
          {sections.map((s, index) => (
            <section key={index} className={style.TypeDialog__Section}>
              <h2>{s.title}</h2>
              {s.children}
            </section>
          ))}

          {!withSplitPreview && (
            <div className={style.TypeDialog__Right}>
              <h2>Preview</h2>
              <VisTypePreview className={style.TypeDialogGridItemImage} vm={vm} />
            </div>
          )}
        </div>

        {withSplitPreview && (
          <>
            <div className={style.VerticalRuler} />
            <div className={style.TypeDialog__Right}>
              <h2>Preview</h2>
              <VisTypePreview className={style.TypeDialogGridItemImage} vm={vm} />
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export { TypePlaceholderModal };
