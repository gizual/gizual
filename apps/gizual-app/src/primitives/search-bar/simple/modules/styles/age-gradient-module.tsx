import { IconPalette } from "@app/assets";
import { useSettingsController } from "@app/controllers";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import { useLocalQueryCtx } from "@app/utils";
import { ColorPicker } from "antd";
import { Color } from "antd/es/color-picker";

import { SimpleSearchModule } from "../base-module";
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

  const onChangeColorOld = (e: Color) => {
    updateLocalQuery({
      preset: {
        gradientByAge: [`#${e.toHex(false)}`, colorNew],
      },
    });
  };

  const onChangeColorNew = (e: Color) => {
    updateLocalQuery({
      preset: {
        gradientByAge: [colorOld, `#${e.toHex(false)}`],
      },
    });
  };

  return (
    <SimpleSearchModule icon={<IconPalette />} title={"Palette by Age:"} hasRemoveIcon>
      <div className={style.SpacedChildren}>
        <div className={style.SpacedSmall}>
          <div className={style.ControlWithLabel}>
            <p className={style["ControlWithLabel__Label"]}>Old:</p>
            <ColorPicker
              value={colorOld}
              size="small"
              showText
              onChangeComplete={publishLocalQuery}
              onChange={onChangeColorOld}
              className={sharedStyle.colorPicker}
            />
          </div>
          <div className={sharedStyle.Separator}></div>
          <div className={style.ControlWithLabel}>
            <p className={style["ControlWithLabel__Label"]}>New:</p>
            <ColorPicker
              value={colorNew}
              size="small"
              showText
              onChangeComplete={publishLocalQuery}
              onChange={onChangeColorNew}
              className={sharedStyle.colorPicker}
            />
          </div>
        </div>
      </div>
    </SimpleSearchModule>
  );
}
