import { TextInput as MantineTextInput, TextInputProps } from "@mantine/core";

import style from "./input.module.scss";

export type InputProps = TextInputProps;

export function Input(props: InputProps) {
  const { ...mantineProps } = props;

  return (
    <MantineTextInput
      className={style.Input}
      size="sm"
      styles={{
        input: {
          height: 30,
          minHeight: 30,
        },
      }}
      {...mantineProps}
    />
  );
}
