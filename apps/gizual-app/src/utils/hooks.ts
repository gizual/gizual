import { useEffect, useLayoutEffect, useState } from "react";

export function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

export const useTheme = () => {
  const defaultTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const [theme, setTheme] = useState<"dark" | "light">(defaultTheme);
  useEffect(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => e.matches && setTheme("dark"));
    window
      .matchMedia("(prefers-color-scheme: light)")
      .addEventListener("change", (e) => e.matches && setTheme("light"));
  }, []);
  return theme;
};

export const useDoc = () => {
  const [doc, setDoc] = useState<HTMLElement | undefined>();
  useEffect(() => {
    setDoc(document.documentElement);
  }, []);

  return doc;
};

export const useStyle = (key: string) => {
  const doc = useDoc();
  const theme = useTheme();
  const [style, setStyle] = useState<string>("#f00");
  useEffect(() => {
    if (!doc) return;
    setStyle(getComputedStyle(doc).getPropertyValue(key));
  }, [doc, key, theme]);

  return style;
};
