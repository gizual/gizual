import { IconFile } from "@app/assets";
import { Menu } from "@mantine/core";

import { useQuery } from "@giz/maestro/react";
import { PlaceholderQueryModule } from "../base-query-module";

import { FileMenuItems } from "./file-menu";

export function FilePlaceholderModule() {
  const query = useQuery();

  return (
    <Menu position="bottom" withArrow>
      <Menu.Target>
        <PlaceholderQueryModule
          icon={<IconFile />}
          title={"Add file-based filter"}
          accentColor="#a3007b"
        />
      </Menu.Target>
      <FileMenuItems query={query} />
    </Menu>
  );
}
