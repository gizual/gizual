import { Popover } from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
import { observer } from "mobx-react-lite";
import React from "react";
import { HexAlphaColorPicker } from "react-colorful";

import { ColorManager } from "@giz/color-manager";
import { Button } from "../button";
import { IconButton } from "../icon-button";

import style from "./color-picker.module.scss";

type ColorPickerProps = {
  hexValue: string;
  onChange?: (newHexValue: string) => void;
  onAccept?: (newHexValue: string) => void;
};

const colorManager = new ColorManager({ domain: [] });

function isValidHexValue(value: string) {
  return /^#([\dA-Fa-f]{6}|[\dA-Fa-f]{3})$/.test(value);
}

function convertRgbToHex(rgb: string) {
  return ColorManager.stringToHex(rgb);
}

function getValidHexValue(value: string) {
  if (isValidHexValue(value)) {
    return value;
  }

  const convertedValue = convertRgbToHex(value);
  if (isValidHexValue(convertedValue)) {
    return convertedValue;
  }

  return "#000000";
}

function useColor(hexValue: string) {
  const [color, setColor] = React.useState(getValidHexValue(hexValue));

  React.useEffect(() => {
    setColor(getValidHexValue(hexValue));
  }, [hexValue]);

  return [color, setColor] as const;
}

export const ColorPicker = observer(({ hexValue, onChange, onAccept }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [color, setColor] = useColor(hexValue);
  const [initialColor] = useColor(hexValue);
  const ref = useClickOutside(() => onCancel());

  const onCancel = () => {
    setColor(initialColor);
    setIsOpen(false);
  };

  const onApply = () => {
    onAccept?.(color.toString());
    setIsOpen(false);
  };

  return (
    <Popover opened={isOpen} withArrow>
      <Popover.Dropdown
        ref={ref}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onCancel();
          }
          if (e.key === "Enter") {
            onApply();
          }
        }}
      >
        <div className={style.PickerContainer}>
          <HexAlphaColorPicker
            color={color}
            onChange={(c) => {
              onChange?.(c);
              setColor(c);
            }}
          />
          <p>Value: {color}</p>
          <h3>Color Presets</h3>
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
              variant={"gray"}
              onClick={() => {
                onCancel();
              }}
            >
              Cancel
            </Button>

            <Button
              variant={"filled"}
              onClick={() => {
                onApply();
              }}
            >
              Accept
            </Button>
          </div>
        </div>
      </Popover.Dropdown>
      <Popover.Target>
        <IconButton
          className={style.IconButton}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
          }}
          aria-expanded={isOpen}
        >
          <div className={style.ColorPreview} style={{ backgroundColor: color }}></div>
        </IconButton>
      </Popover.Target>
    </Popover>
  );
});
