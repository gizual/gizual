import clsx from "clsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactZoomPanPinchRef,
  useTransformContext,
  useTransformEffect,
  useTransformInit,
} from "react-zoom-pan-pinch";

import { MasonryGrid } from "../masonry";

import { CanvasContext } from "./canvas.context";
import style from "./canvas.module.scss";
import { useResize } from "./use-resize";

type MiniMapContentProps = {
  masonryWidth: number;
};

function MiniMapContent({ masonryWidth }: MiniMapContentProps) {
  const blocks = React.useContext(CanvasContext).useBlocks();
  return (
    <MasonryGrid
      width={masonryWidth}
      childInfo={blocks.map((b) => ({ id: b.id, height: b.height + 26 }))}
    >
      {blocks.map((block, index) => {
        return (
          <div
            key={index}
            style={{
              width: 300,
              minHeight: block.height + 26,
              backgroundColor: "var(--foreground-secondary)",
              opacity: 0.5,
              border: "1px solid var(--border-primary)",
              position: "relative",
              display: "block",
            }}
          ></div>
        );
      })}
    </MasonryGrid>
  );
}

export type MiniMapProps = {
  children: React.ReactNode;
  width?: number;
  height?: number;
  previewStyles?: React.CSSProperties;
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const defaultPreviewStyles = {
  position: "absolute",
  zIndex: 2,
  top: "0.1px",
  left: "0.1px",
  boxSizing: "border-box",
  border: "2px solid red",
  transformOrigin: "0% 0%",
  boxShadow: "rgba(0,0,0,0.2) 0 0 0 10000000px",
} as const;

/**
 * This is an adaptation of the default minimap component provided by react-zoom-pan-pinch.
 * The original source code can be found here:
 *
 * @see https://github.com/BetterTyped/react-zoom-pan-pinch/blob/11c0f41dfb821579ba6eda0b6938fe89fe4e4744/src/components/mini-map/mini-map.tsx
 */
const MiniMap: React.FC<MiniMapProps> = ({
  width = 200,
  height = 200,
  children,
  previewStyles,
  ...rest
}) => {
  const [initialized, setInitialized] = useState(false);
  const instance = useTransformContext();
  const miniMapInstance = useRef<ReactZoomPanPinchRef>(null);

  const mainRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const getContentSize = useCallback(() => {
    if (instance.contentComponent) {
      const rect = instance.contentComponent.getBoundingClientRect();

      return {
        width: rect.width / instance.transformState.scale,
        height: rect.height / instance.transformState.scale,
      };
    }
    return {
      width: 0,
      height: 0,
    };
  }, [instance.contentComponent, instance.transformState.scale]);

  const getWrapperSize = useCallback(() => {
    if (instance.wrapperComponent) {
      const rect = instance.wrapperComponent.getBoundingClientRect();

      return {
        width: rect.width,
        height: rect.height,
      };
    }
    return {
      width: 0,
      height: 0,
    };
  }, [instance.wrapperComponent]);

  const computeMiniMapScale = useCallback(() => {
    const contentSize = getContentSize();
    const scaleX = width / contentSize.width;
    const scaleY = height / contentSize.height;
    const scale = scaleY > scaleX ? scaleX : scaleY;

    return scale;
  }, [getContentSize, height, width]);

  const computeMiniMapSize = () => {
    const contentSize = getContentSize();
    const scaleX = width / contentSize.width;
    const scaleY = height / contentSize.height;
    if (scaleY > scaleX) {
      return { width, height: contentSize.height * scaleX };
    }
    return { width: contentSize.width * scaleY, height };
  };

  const computeMiniMapStyle = () => {
    const scale = computeMiniMapScale();
    const style = {
      transform: `scale(${scale || 1})`,
      transformOrigin: "0% 0%",
      position: "absolute",
      boxSizing: "border-box",
      zIndex: 1,
      overflow: "hidden",
    } as any;

    for (const key of Object.keys(style)) {
      if (wrapperRef.current) {
        wrapperRef.current.style[key as any] = style[key];
      }
    }
  };

  const transformMiniMap = () => {
    computeMiniMapStyle();
    const miniSize = computeMiniMapSize();
    const wrapSize = getContentSize();
    if (wrapperRef.current) {
      wrapperRef.current.style.width = `${wrapSize.width}px`;
      wrapperRef.current.style.height = `${wrapSize.height}px`;
    }
    if (mainRef.current) {
      mainRef.current.style.width = `${miniSize.width}px`;
      mainRef.current.style.height = `${miniSize.height}px`;
    }
    if (previewRef.current) {
      const size = getWrapperSize();
      const scale = computeMiniMapScale();
      const previewScale = scale * (1 / instance.transformState.scale);
      const transform = instance.handleTransformStyles(
        -instance.transformState.positionX * previewScale,
        -instance.transformState.positionY * previewScale,
        1,
      );

      previewRef.current.style.transform = transform;
      previewRef.current.style.width = `${size.width * previewScale}px`;
      previewRef.current.style.height = `${size.height * previewScale}px`;
    }
  };

  const initialize = () => {
    transformMiniMap();
  };

  useTransformEffect(() => {
    transformMiniMap();
  });

  useTransformInit(() => {
    initialize();
    setInitialized(true);
  });

  useResize(instance.contentComponent, initialize, [initialized]);

  useEffect(() => {
    return instance.onChange((zpp) => {
      const scale = computeMiniMapScale();
      if (miniMapInstance.current) {
        miniMapInstance.current.instance.transformState.scale = zpp.instance.transformState.scale;
        miniMapInstance.current.instance.transformState.positionX =
          zpp.instance.transformState.positionX * scale;
        miniMapInstance.current.instance.transformState.positionY =
          zpp.instance.transformState.positionY * scale;
      }
    });
  }, [computeMiniMapScale, instance, miniMapInstance]);

  const wrapperStyle = useMemo(() => {
    return {
      position: "relative",
      zIndex: 2,
      overflow: "hidden",
    } as const;
  }, []);

  return (
    <div
      {...rest}
      ref={mainRef}
      style={wrapperStyle}
      className={clsx("rzpp-mini-map", style.Minimap, rest.className)}
    >
      <div {...rest} ref={wrapperRef} className="rzpp-wrapper">
        {children}
      </div>
      <div
        className="rzpp-preview"
        ref={previewRef}
        style={{ ...defaultPreviewStyles, ...previewStyles }}
      />
    </div>
  );
};

export { MiniMap, MiniMapContent };
