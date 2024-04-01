import React from "react";

import { useDocument } from "./use-document";
import { usePreferredColorScheme } from "./use-preferred-color-scheme";

function useStyle(key: string) {
  const doc = useDocument();
  const preferredColorScheme = usePreferredColorScheme();
  const [style, setStyle] = React.useState<string>("#00000000");
  React.useEffect(() => {
    if (!doc) return;
    setStyle(getComputedStyle(doc).getPropertyValue(key));
  }, [doc, key, preferredColorScheme]);

  return style;
}

export { useStyle };
