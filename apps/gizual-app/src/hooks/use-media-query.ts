import React from "react";

function useMediaQuery(
  breakpoint: { min?: number; max?: number },
  dimension: "width" | "height" = "width",
) {
  const [matches, setMatches] = React.useState(false);
  const { min, max } = breakpoint;

  if (min === undefined && max === undefined) {
    throw new Error("Either min or max must be defined");
  }

  if (min !== undefined && max !== undefined && min > max) {
    throw new Error("min must be less than or equal to max");
  }

  let query = "";
  if (min === undefined && max !== undefined) {
    query = `(max-${dimension}: ${max - 1}px)`;
  } else if (max === undefined && min !== undefined) {
    query = `(min-${dimension}: ${min}px)`;
  } else {
    query = `(min-${dimension}: ${min}px) and (max-width: ${max}px)`;
  }

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener("change", listener);
    setMatches(mediaQuery.matches);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [min, max]);

  return matches;
}

export { useMediaQuery };
