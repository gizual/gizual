import React from "react";

function usePreferredColorScheme() {
  const defaultPreferredColorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  const [preferredColorScheme, setPreferredColorScheme] = React.useState<"dark" | "light">(
    defaultPreferredColorScheme,
  );
  React.useEffect(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => e.matches && setPreferredColorScheme("dark"));
    window
      .matchMedia("(prefers-color-scheme: light)")
      .addEventListener("change", (e) => e.matches && setPreferredColorScheme("light"));
  }, []);
  return preferredColorScheme;
}

export { usePreferredColorScheme };
