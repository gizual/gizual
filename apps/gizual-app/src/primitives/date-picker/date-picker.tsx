import { DatePickerInput } from "@mantine/dates";

type DatePickerProps = {} & React.ComponentProps<typeof DatePickerInput>;

/**
 * Wrapper around the Mantine DatePickerInput component.
 * @param props - The props for the DatePicker component.
 */
function DatePicker({ ...props }: DatePickerProps) {
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
      }}
      {...props}
      valueFormat="DD MMM YYYY"
    />
  );
}

export { DatePicker };
