import { IconPalette } from "@app/assets";
import { useSettingsController } from "@app/controllers";
import { ColorPicker } from "@app/primitives/color-picker";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import { useLocalQueryCtx } from "@app/utils";

import { BaseQueryModule } from "../base-query-module";
import style from "../modules.module.scss";

export function AgeGradientModule() {
  const settingsController = useSettingsController();
  const { localQuery, publishLocalQuery, updateLocalQuery } = useLocalQueryCtx();
  let colorOld = "#FFF";
  let colorNew = "#FFF";
  if (
    localQuery.preset &&
    "gradientByAge" in localQuery.preset &&
    Array.isArray(localQuery.preset.gradientByAge)
  ) {
    // TODO: For now, we only use the first and last array entry for the gradient
    colorOld =
      localQuery.preset.gradientByAge.at(0) ??
      settingsController.settings.visualizationSettings.colors.old.defaultValue;
    colorNew =
      localQuery.preset.gradientByAge.at(-1) ??
      settingsController.settings.visualizationSettings.colors.new.defaultValue;
  }

  const onChangeColorOld = (e: string) => {
    updateLocalQuery({
      preset: {
        gradientByAge: [e, colorNew],
      },
    });
  };

  const onChangeColorNew = (e: string) => {
    updateLocalQuery({
      preset: {
        gradientByAge: [colorOld, e],
      },
    });
  };

  return (
    <BaseQueryModule icon={<IconPalette />} title={"Palette by Age:"} hasSwapButton>
      <div className={style.SpacedChildren}>
        <div className={style.SpacedSmall}>
          <div className={style.ControlWithLabel}>
            <p className={style["ControlWithLabel__Label"]}>Old:</p>
            <ColorPicker
              hexValue={colorOld}
              onChange={onChangeColorOld}
              onAccept={publishLocalQuery}
            />
          </div>
          <div className={sharedStyle.Separator}></div>
          <div className={style.ControlWithLabel}>
            <p className={style["ControlWithLabel__Label"]}>New:</p>
            <ColorPicker
              hexValue={colorNew}
              onChange={onChangeColorNew}
              onAccept={publishLocalQuery}
            />
          </div>
        </div>
      </div>
    </BaseQueryModule>
  );
}
