import { DatePickerInput } from "@mantine/dates";

import { DATE_DISPLAY_FORMAT } from "@giz/utils/gizdate";

import style from "./date-picker.module.scss";

type DatePickerProps = {} & React.ComponentProps<typeof DatePickerInput>;

/**
 * Wrapper around the Mantine DatePickerInput component.
 * @param props - The props for the DatePicker component.
 */
function DatePicker({ styles, ...props }: DatePickerProps) {
  const height = 30;
  return (
    <DatePickerInput
      className={style.DatePicker}
      styles={{
        input: {
          height: height,
          minHeight: height,
          maxHeight: height,
          padding: "0 0.5rem",
          minWidth: 150,
          width: "100%",
        },
        label: {
          fontWeight: 500,
        },
        ...styles,
      }}
      {...props}
      valueFormat={DATE_DISPLAY_FORMAT}
    />
  );
}

export { DatePicker };
