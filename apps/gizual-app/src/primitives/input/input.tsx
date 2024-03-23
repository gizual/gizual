import { TextInput as MantineTextInput, TextInputProps } from "@mantine/core";

import style from "./input.module.scss";

export type InputProps = { monospaced?: boolean } & TextInputProps;

/**
 * Custom wrapper around Mantine's TextInput.
 * Attaches an `onBlur` event to the Enter key and applies default styling.
 */
export function Input({ monospaced, ...props }: InputProps) {
  const { styles, onBlur, onKeyDown, ...mantineProps } = props;
  const height = 30;

  return (
    <MantineTextInput
      className={style.Input}
      size="sm"
      styles={{
        input: {
          height: height,
          minHeight: height,
          minWidth: 150,
          width: "100%",
          fontFamily: monospaced ? "Iosevka Extended" : "Figtree",
        },
        root: {
          width: "100%",
        },
        ...styles,
      }}
      onBlur={(e) => {
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
        onKeyDown?.(e);
      }}
      {...mantineProps}
    />
  );
}
