import * as RSelect from "@radix-ui/react-select";

import { ReactComponent as ChevronDownIcon } from "../../assets/icons/chevron-down.svg";

import "./select.css";
export type SelectProps = {};
export function Select(props: SelectProps) {
  return (
    <RSelect.Root>
      <RSelect.Trigger className="SelectTrigger" aria-label="Select Component">
        <RSelect.Value placeholder="Select a fruit…" />
        <RSelect.Icon className="SelectIcon">
          <ChevronDownIcon />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content className="SelectContent">
          <RSelect.ScrollUpButton className="SelectScrollButton">
            <ChevronDownIcon />
          </RSelect.ScrollUpButton>
          <RSelect.Viewport className="SelectViewport">
            <RSelect.Group>
              <RSelect.Label className="SelectLabel">Fruits</RSelect.Label>
              <RSelect.Item className="SelectItem" value="apple">
                <RSelect.ItemText>Apple</RSelect.ItemText>
              </RSelect.Item>
              <RSelect.Item className="SelectItem" value="banana">
                <RSelect.ItemText>Banana</RSelect.ItemText>
              </RSelect.Item>
              <RSelect.Item className="SelectItem" value="croissant">
                <RSelect.ItemText>Croissant</RSelect.ItemText>
              </RSelect.Item>
            </RSelect.Group>
            <RSelect.Separator />
          </RSelect.Viewport>
          <RSelect.ScrollDownButton />
          <RSelect.Arrow />
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
