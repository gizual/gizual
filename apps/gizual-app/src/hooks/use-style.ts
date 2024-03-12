import React from "react";

import { useDocument } from "./use-document";
import { useTheme } from "./use-theme";

function useStyle(key: string) {
  const doc = useDocument();
  const theme = useTheme();
  const [style, setStyle] = React.useState<string>("#00000000");
  React.useEffect(() => {
    if (!doc) return;
    setStyle(getComputedStyle(doc).getPropertyValue(key));
  }, [doc, key, theme]);

  return style;
}

export { useStyle };
