import { IconPalette } from "@app/assets";
import { useSettingsController } from "@app/controllers";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import { ColorPicker } from "antd";
import { Color } from "antd/es/color-picker";

import { useQuery } from "@giz/maestro/react";
import { SimpleSearchModule } from "../base-module";
import style from "../modules.module.scss";

export function AgeGradientModule() {
  const settingsController = useSettingsController();
  const query = useQuery();
  let colorOld = "#FFF";
  let colorNew = "#FFF";
  if (
    "mode" in query.query &&
    "type" in query.query.mode &&
    query.query.mode.type === "gradient-age"
  ) {
    // TODO: For now, we only use the first and last array entry for the gradient
    colorOld =
      query.query.mode.values?.at(0) ??
      settingsController.settings.visualizationSettings.colors.old.defaultValue;
    colorNew =
      query.query.mode.values?.at(-1) ??
      settingsController.settings.visualizationSettings.colors.new.defaultValue;
  }

  const onChangeColorOld = (e: Color) => {
    query.updateQuery({
      mode: {
        type: "gradient-age",
        values: [`#${e.toHex(false)}`, colorNew],
      },
    });
  };

  const onChangeColorNew = (e: Color) => {
    query.updateQuery({
      mode: {
        type: "gradient-age",
        values: [colorOld, `#${e.toHex(false)}`],
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
              defaultValue={colorOld}
              size="small"
              showText
              onChangeComplete={onChangeColorOld}
              className={sharedStyle.colorPicker}
            />
          </div>
          <div className={sharedStyle.Separator}></div>
          <div className={style.ControlWithLabel}>
            <p className={style["ControlWithLabel__Label"]}>New:</p>
            <ColorPicker
              defaultValue={colorNew}
              size="small"
              showText
              onChangeComplete={onChangeColorNew}
              className={sharedStyle.colorPicker}
            />
          </div>
        </div>
      </div>
    </SimpleSearchModule>
  );
}
