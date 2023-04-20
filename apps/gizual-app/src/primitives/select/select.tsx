import * as RSelect from "@radix-ui/react-select";

import { ReactComponent as ChevronDownIcon } from "../../assets/icons/chevron-down.svg";
import { ReactComponent as ChevronUpIcon } from "../../assets/icons/chevron-up.svg";

import style from "./select.module.scss";

export type SelectEntry = {
  value: string;
  label: string;
};
export type SelectProps = {
  data: SelectEntry[];

  onValueChange?: (value: string) => void;
  groupTitle?: string;
  placeholder?: string;
};

export function Select({ groupTitle, placeholder, data, onValueChange }: SelectProps) {
  return (
    <RSelect.Root onValueChange={onValueChange}>
      <RSelect.Trigger className={style.SelectTrigger} aria-label="Select Component">
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon className={style.SelectIcon}>
          <ChevronDownIcon />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content className={style.SelectContent}>
          <RSelect.ScrollUpButton className={style.SelectScrollButton}>
            <ChevronUpIcon />
          </RSelect.ScrollUpButton>
          <RSelect.Viewport className={style.SelectViewport}>
            <RSelect.Group>
              <RSelect.Label className={style.SelectLabel}>{groupTitle}</RSelect.Label>
              {data.map((entry, index) => (
                <RSelect.Item className={style.SelectItem} value={entry.value} key={index}>
                  <RSelect.ItemText>{entry.label}</RSelect.ItemText>
                </RSelect.Item>
              ))}
            </RSelect.Group>

            <RSelect.Separator />
          </RSelect.Viewport>
          <RSelect.Arrow />
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
