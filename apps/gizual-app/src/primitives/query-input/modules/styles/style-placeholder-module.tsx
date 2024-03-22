import { IconPalette } from "@app/assets";
import { Menu } from "@mantine/core";

import { useQuery } from "@giz/maestro/react";
import { PlaceholderQueryModule } from "../base-query-module";

import { StyleMenuItems } from "./style-menu";

export function StylePlaceholderModule() {
  const query = useQuery();

  return (
    <Menu position="bottom" withArrow>
      <Menu.Target>
        <PlaceholderQueryModule
          icon={<IconPalette />}
          title={"Add style accent"}
          accentColor="#b84900"
        />
      </Menu.Target>
      <StyleMenuItems query={query} />
    </Menu>
  );
}
