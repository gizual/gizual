import { Popover } from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
import React from "react";
import { HexAlphaColorPicker } from "react-colorful";

import { ColorManager } from "@giz/color-manager";
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
  const ref = useClickOutside(() => setIsOpen(false));

  return (
    <Popover opened={isOpen} withArrow>
      <Popover.Dropdown
        ref={ref}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false);
          }
          if (e.key === "Enter") {
            onAccept?.(color.toString());
            setIsOpen(false);
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
              variant={"gray"}
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>

            <Button
              variant={"filled"}
              onClick={() => {
                onAccept?.(color.toString());
                setIsOpen(false);
              }}
            >
              Accept
            </Button>
          </div>
        </div>
      </Popover.Dropdown>
      <Popover.Target>
        <IconButton
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
        >
          <div className={style.ColorPreview} style={{ backgroundColor: hexValue }}></div>
        </IconButton>
      </Popover.Target>
    </Popover>
  );
});
