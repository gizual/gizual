import { IconClock } from "@app/assets";
import { Menu } from "@mantine/core";

import { useQuery } from "@giz/maestro/react";
import { PlaceholderQueryModule } from "../base-query-module";

import { TimeMenuItems } from "./time-menu";

export function TimePlaceholderModule() {
  const query = useQuery();

  return (
    <Menu position="bottom" withArrow>
      <Menu.Target>
        <PlaceholderQueryModule
          icon={<IconClock />}
          title={"Add time-based filter"}
          accentColor="#006aa3"
        />
      </Menu.Target>
      <TimeMenuItems query={query} />
    </Menu>
  );
}
