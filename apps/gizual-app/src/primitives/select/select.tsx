import * as RSelect from "@radix-ui/react-select";

import { ReactComponent as ChevronDownIcon } from "../../assets/icons/chevron-down.svg";
import { ReactComponent as ChevronUpIcon } from "../../assets/icons/chevron-up.svg";

import "./select.css";

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
      <RSelect.Trigger className="SelectTrigger" aria-label="Select Component">
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon className="SelectIcon">
          <ChevronDownIcon />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content className="SelectContent">
          <RSelect.ScrollUpButton className="SelectScrollButton">
            <ChevronUpIcon />
          </RSelect.ScrollUpButton>
          <RSelect.Viewport className="SelectViewport">
            <RSelect.Group>
              <RSelect.Label className="SelectLabel">{groupTitle}</RSelect.Label>
              {data.map((entry, index) => (
                <RSelect.Item className="SelectItem" value={entry.value} key={index}>
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
