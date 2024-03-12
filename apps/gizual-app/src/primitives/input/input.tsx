import { TextInput as MantineTextInput, TextInputProps } from "@mantine/core";

import style from "./input.module.scss";

export type InputProps = {} & TextInputProps;

/**
 * Custom wrapper around Mantine's TextInput.
 * Attaches an `onBlur` event to the Enter key and applies default styling.
 */
export function Input(props: InputProps) {
  const { styles, onBlur, onKeyDown, ...mantineProps } = props;

  return (
    <MantineTextInput
      className={style.Input}
      size="sm"
      styles={{
        input: {
          height: 30,
          minHeight: 30,
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
