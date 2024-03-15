import { useMediaQuery } from "@app/hooks/use-media-query";
import { DatePickerInput } from "@mantine/dates";

import { DATE_DISPLAY_FORMAT } from "@giz/utils/gizdate";

type DatePickerProps = {} & React.ComponentProps<typeof DatePickerInput>;

/**
 * Wrapper around the Mantine DatePickerInput component.
 * @param props - The props for the DatePicker component.
 */
function DatePicker({ styles, ...props }: DatePickerProps) {
  const isSmallDevice = useMediaQuery({ max: 1024 });
  const height = isSmallDevice ? 40 : 30;
  return (
    <DatePickerInput
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
          fontWeight: 300,
        },
        ...styles,
      }}
      {...props}
      label={isSmallDevice ? props.label : ""}
      valueFormat={DATE_DISPLAY_FORMAT}
    />
  );
}

export { DatePicker };
