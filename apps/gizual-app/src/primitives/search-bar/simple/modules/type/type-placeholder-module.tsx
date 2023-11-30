import { IconSettingsOutline } from "@app/assets";

import { PlaceHolderModule } from "../base-module";

export function TypePlaceholderModule() {
  return (
    <PlaceHolderModule
      icon={<IconSettingsOutline />}
      title={"Choose a render-type"}
      accentColor="#237600"
    />
  );
}
