import { useMediaQuery } from "@app/hooks/use-media-query";
import { TextInput as MantineTextInput, TextInputProps } from "@mantine/core";

import style from "./input.module.scss";

export type InputProps = {} & TextInputProps;

/**
 * Custom wrapper around Mantine's TextInput.
 * Attaches an `onBlur` event to the Enter key and applies default styling.
 */
export function Input(props: InputProps) {
  const isSmallDevice = useMediaQuery({ max: 1024 });
  const { styles, onBlur, onKeyDown, ...mantineProps } = props;
  const height = isSmallDevice ? 40 : 30;

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
