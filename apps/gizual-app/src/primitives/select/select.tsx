import { useMediaQuery } from "@app/hooks/use-media-query";
import { Select as MantineSelect, SelectProps as MantineSelectProps } from "@mantine/core";

import style from "./select.module.scss";

export type SelectOption<T> = { label: string; value: string; payload?: T };

export type SelectProps<T> = {
  data?: SelectOption<T>[];
  onChange: (value: string, payload: T) => void;
} & Omit<MantineSelectProps, "onChange" | "data">;

export function Select<T = undefined>(props: SelectProps<T>) {
  const isSmallDevice = useMediaQuery({ max: 1024 });
  const { data, onChange, ...mantineProps } = props;

  const onChangeWrapper = (value: string | null) => {
    if (!data) return;

    const item = data.find((d) => d.value === value);

    if (item) {
      const payload = item?.payload ?? item?.value;
      onChange(item.value, payload as T);
    }
  };

  const height = isSmallDevice ? 40 : 30;

  return (
    <MantineSelect
      checkIconPosition={undefined}
      withCheckIcon={false}
      className={style.SelectBox}
      onChange={onChangeWrapper}
      data={data}
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
      }}
      allowDeselect={false}
      {...mantineProps}
    />
  );
}
