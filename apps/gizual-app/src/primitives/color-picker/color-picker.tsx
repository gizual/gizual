import { ColorManager } from "@app/utils/colors";
import { Popover } from "antd";
import React from "react";
import { HexAlphaColorPicker } from "react-colorful";

import { IconButton } from "../icon-button";

import { Button } from "..";
import style from "./color-picker.module.scss";

type ColorPickerProps = {
  hexValue: string;
  onChange?: (newHexValue: string) => void;
  onAccept?: (newHexValue: string) => void;
};

const colorManager = new ColorManager({ domain: [] });

export const ColorPicker = React.memo(({ hexValue, onChange, onAccept }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [color, setColor] = React.useState(hexValue);

  return (
    <Popover
      content={
        <div className={style.PickerContainer}>
          <HexAlphaColorPicker
            color={color}
            onChange={(c) => {
              onChange?.(c);
              setColor(c);
            }}
          />
          <p>Current value: {color}</p>
          <h3>Color presets</h3>
          <div className={style.ColorBand}>
            {colorManager.colorBand.map((c) => {
              return (
                <IconButton
                  key={c}
                  onClick={() => {
                    setColor(ColorManager.stringToHex(c));
                  }}
                >
                  <div className={style.Swatch} style={{ backgroundColor: c }} />
                </IconButton>
              );
            })}
          </div>
          <div className={style.ButtonRow}>
            <Button
              variant={"filled"}
              onClick={() => {
                onAccept?.(color.toString());
                setIsOpen(false);
              }}
            >
              Accept
            </Button>
            <Button
              variant={"gray"}
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      }
      open={isOpen}
    >
      <IconButton onClick={() => setIsOpen(!isOpen)}>
        <div className={style.ColorPreview} style={{ backgroundColor: hexValue }}></div>
      </IconButton>
    </Popover>
  );
});
