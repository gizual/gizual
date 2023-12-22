import { IconClose } from "@app/assets";
import { useWindowSize } from "@app/utils";
import React from "react";
import { createPortal } from "react-dom";

import sharedStyle from "../css/shared-styles.module.scss";
import { IconButton } from "../icon-button";

import style from "./dialog-provider.module.scss";

export type PopoverProviderProps = {
  title?: string;
  trigger: React.ReactNode | React.ReactNode[];
  triggerClassName?: string;
  children: React.ReactNode | React.ReactNode[];
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
};

const MIN_FULL_SCREEN_WIDTH = 768;
const MIN_FULL_SCREEN_HEIGHT = 768;

export const DialogProvider = React.memo(
  ({ trigger, triggerClassName, children, title, isOpen, setIsOpen }: PopoverProviderProps) => {
    if (isOpen === undefined || setIsOpen === undefined)
      [isOpen, setIsOpen] = React.useState(false);

    const ref = React.useRef<HTMLDivElement>(null);
    const [width, setWidth] = React.useState<string | undefined>(undefined);
    const [height, setHeight] = React.useState<string | undefined>(undefined);
    const [screenWidth, screenHeight] = useWindowSize();

    // Assign a stable width and height to the popover so that it doesn't
    // jump around when the content gets smaller.
    React.useEffect(() => {
      if (ref.current && isOpen) {
        const newWidth = Math.min(ref.current.clientWidth, screenWidth - 100);
        const newHeight = Math.min(ref.current.clientHeight, screenHeight - 100);

        setWidth(newWidth + "px");
        setHeight(newHeight + "px");
      }
    }, [ref.current, isOpen, screenWidth, screenHeight]);

    const isFullscreen =
      screenWidth < MIN_FULL_SCREEN_WIDTH || screenHeight < MIN_FULL_SCREEN_HEIGHT;

    return (
      <>
        <div
          className={triggerClassName ?? style.Trigger}
          onClick={() => {
            setIsOpen!(true);
          }}
        >
          {trigger}
        </div>
        {isOpen &&
          createPortal(
            <>
              <div
                className={sharedStyle.PopoverUnderlay}
                onClick={() => {
                  setIsOpen!(false);
                }}
              ></div>
              <div
                className={style.Dialog}
                ref={ref}
                style={{
                  minWidth: width,
                  minHeight: height,
                  width: isFullscreen ? screenWidth : undefined,
                  maxWidth: isFullscreen ? screenWidth : "80%",
                  height: isFullscreen ? screenHeight : undefined,
                  maxHeight: isFullscreen ? screenHeight : "80%",
                }}
              >
                <div className={style.DialogHead}>
                  <h2 className={style.DialogTitle}>{title}</h2>
                  <IconButton
                    className={sharedStyle.CloseButton}
                    onClick={() => {
                      setIsOpen!(false);
                    }}
                  >
                    <IconClose />
                  </IconButton>
                </div>
                <div className={style.DialogBody}>{children}</div>
              </div>
            </>,
            document.body,
          )}
      </>
    );
  },
);
