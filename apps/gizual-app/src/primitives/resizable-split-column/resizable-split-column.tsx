import { IconDragVertical } from "@app/assets/icons";
import { isRef } from "@app/utils/tsutils";
import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";

import style from "./resizable-split-column.module.scss";

type ResizableSplitColumnProps = {
  children: React.ReactNode[];
  className?: string;
  style?: React.CSSProperties;
};
const ResizableSplitColumn = ({ children, className, style: css }: ResizableSplitColumnProps) => {
  const containerRef = useRef(null);
  const columnRefs = useRef<(HTMLElement | null)[]>([]);
  const [dragging, setDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!children) return;
    // Adjust columnRefs to match the number of children
    columnRefs.current = columnRefs.current.slice(0, children.length);
  }, [children]);

  const handleMouseDown = (index: number, event: React.MouseEvent<HTMLElement>) => {
    setDragIndex(index);
    setDragging(true);
    event.preventDefault();
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (!dragging || dragIndex === undefined) return;

    const leftPanel = columnRefs.current[dragIndex];
    const rightPanel = columnRefs.current[dragIndex + 1];

    if (leftPanel && rightPanel) {
      const deltaX = event.clientX - leftPanel.getBoundingClientRect().right;
      const leftWidth = leftPanel.offsetWidth + deltaX;
      const rightWidth = rightPanel.offsetWidth - deltaX;

      leftPanel.style.width = `${leftWidth}px`;
      rightPanel.style.width = `${rightWidth}px`;
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
    setDragIndex(undefined);
  };

  return (
    <div
      ref={containerRef}
      className={clsx(style.ResizableSplitContainer, className)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={css}
    >
      {children.map((child, index) => {
        if (!isRef(child as React.ForwardedRef<unknown>))
          throw new Error(
            "Children received by ResizableSplitColumn must be wrapped in forwardRef.",
          );
        return (
          <React.Fragment key={index}>
            {React.cloneElement(child as React.ReactElement<any>, {
              key: index,
              ref: (el: HTMLElement) => (columnRefs.current[index] = el),
              className: clsx(
                style.Column,
                (child as React.ReactElement<any>).props.className,
                dragIndex === index || dragIndex === index - 1 ? style.IsBeingResized : "",
              ),
            })}
            {index < children.length - 1 && (
              <div
                className={style.SeparationContainer}
                onMouseDown={(e) => handleMouseDown(index, e)}
              >
                <DragHandle />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

type DragHandleProps = {
  top?: number | string;
  width?: number;
  height?: number;
};

function DragHandle({ width = 15, height = 35, top = "50%" }: DragHandleProps) {
  return (
    <div
      className={style.DragHandle}
      style={{
        left: `-7.5px`,
        top: `calc(${top} - ${height / 2}px)`,
        width: width,
        height: height,
      }}
    >
      <IconDragVertical className={style.DragHandleIcon} />
    </div>
  );
}

const ResizableSplitColumnMemo = React.memo(ResizableSplitColumn);
export { ResizableSplitColumnMemo as ResizableSplitColumn };
