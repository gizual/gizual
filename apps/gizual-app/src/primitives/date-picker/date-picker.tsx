import { DatePickerInput } from "@mantine/dates";

import { DATE_DISPLAY_FORMAT } from "@giz/utils/gizdate";

type DatePickerProps = {} & React.ComponentProps<typeof DatePickerInput>;

/**
 * Wrapper around the Mantine DatePickerInput component.
 * @param props - The props for the DatePicker component.
 */
function DatePicker({ styles, ...props }: DatePickerProps) {
  return (
    <DatePickerInput
      styles={{
        input: {
          height: 30,
          minHeight: 30,
          maxHeight: 30,
          padding: "0 0.5rem",
          minWidth: 150,
        },
        ...styles,
      }}
      {...props}
      valueFormat={DATE_DISPLAY_FORMAT}
    />
  );
}

export { DatePicker };
