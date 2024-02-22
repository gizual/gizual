import React from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

import { useBlocks } from "@giz/maestro/react";

type CanvasContextProps = {
  /**
   * Allows a custom override for the rendering data source.
   * If provided, this function will be called instead of the default useBlocks() hook.
   * This is mainly useful for isolated testing purposes.
   *
   * @returns A list of blocks to render in the canvas.
   */
  useBlocks: typeof useBlocks;

  /**
   * Enables rendering of additional borders and text elements to debug layout issues.
   */
  debugLayout: boolean;

  /**
   * Provides a ref to the rzpp instance because our minimap is placed outside the rzpp component.
   */
  rzppRef: React.RefObject<ReactZoomPanPinchRef>;
};

const CanvasContext = React.createContext({} as CanvasContextProps);

export { CanvasContext };
export type { CanvasContextProps };
