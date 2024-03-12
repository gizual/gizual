import React from "react";

/**
 *  Get the current window size on every resize event.
 *
 *  @deprecated Use `useMediaQuery`, unless you specifically need the exact size.
 */
function useWindowSize() {
  const [size, setSize] = React.useState([0, 0]);
  React.useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

export { useWindowSize };
