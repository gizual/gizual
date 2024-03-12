import React from "react";

function useDocument() {
  const [doc, setDoc] = React.useState<HTMLElement | undefined>();
  React.useEffect(() => {
    setDoc(document.documentElement);
  }, []);

  return doc;
}

export { useDocument };
