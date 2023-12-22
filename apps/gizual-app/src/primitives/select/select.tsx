import { Select as MantineSelect, SelectProps as MantineSelectProps } from "@mantine/core";

import style from "./select.module.scss";

export type SelectOption<T> = { label: string; value: string; payload?: T };

export type SelectProps<T> = {
  data?: SelectOption<T>[];
  onChange: (value: string, payload: T) => void;
} & Omit<MantineSelectProps, "onChange" | "data">;

export function Select<T = undefined>(props: SelectProps<T>) {
  const { data, onChange, ...mantineProps } = props;

  const onChangeWrapper = (value: string | null) => {
    if (!data) return;

    const item = data.find((d) => d.value === value);

    if (item) {
      const payload = item?.payload ?? item?.value;
      onChange(item.value, payload as T);
    }
  };

  return (
    <MantineSelect
      checkIconPosition={undefined}
      withCheckIcon={false}
      className={style.SelectBox}
      onChange={onChangeWrapper}
      data={data}
      {...mantineProps}
    />
  );
}
