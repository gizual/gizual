import { Checkbox as MantineCheckbox, CheckboxProps as MantineCheckboxProps } from "@mantine/core";
import clsx from "clsx";

import style from "./checkbox.module.scss";

type CheckboxProps = MantineCheckboxProps;

/**
 * Custom wrapper around Mantine's Checkbox.
 * Attaches default Gizual styling.
 */
function Checkbox(props: CheckboxProps) {
  return <MantineCheckbox className={clsx(style.Checkbox, props.className)}></MantineCheckbox>;
}

export { Checkbox };
