import { IconClose } from "@app/assets";
import { useWindowSize } from "@app/utils";
import clsx from "clsx";
import React from "react";
import { createPortal } from "react-dom";

import { Button } from "../button";
import sharedStyle from "../css/shared-styles.module.scss";
import { IconButton } from "../icon-button";

import style from "./dialog-provider.module.scss";

export type PopoverProviderProps = {
  title?: string;
  trigger: React.ReactNode | React.ReactNode[];
  triggerClassName?: string;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  children: React.ReactNode | React.ReactNode[];
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  withFooter?: boolean;
  footerComponent?: React.ReactNode | React.ReactNode[];
  defaultFooterOpts?: DialogProviderDefaultFooterProps;
  stableSize?: boolean;
};

const MIN_FULL_SCREEN_WIDTH = 768;
const MIN_FULL_SCREEN_HEIGHT = 768;

export const DialogProvider = React.memo(
  ({
    trigger,
    triggerClassName,
    contentClassName,
    contentStyle,
    children,
    title,
    isOpen,
    setIsOpen,
    withFooter,
    footerComponent,
    defaultFooterOpts,
    stableSize,
  }: PopoverProviderProps) => {
    if (isOpen === undefined || setIsOpen === undefined)
      [isOpen, setIsOpen] = React.useState(false);

    const ref = React.useRef<HTMLDivElement>(null);
    const [width, setWidth] = React.useState<string | undefined>(undefined);
    const [height, setHeight] = React.useState<string | undefined>(undefined);
    const [screenWidth, screenHeight] = useWindowSize();

    // Assign a stable width and height to the popover so that it doesn't
    // jump around when the content gets smaller.
    React.useEffect(() => {
      if (ref.current && isOpen && stableSize) {
        const newWidth = Math.min(ref.current.clientWidth, screenWidth - 100);
        const newHeight = Math.min(ref.current.clientHeight, screenHeight - 100);
        setWidth(newWidth + "px");
        setHeight(newHeight + "px");
      }
    }, [ref.current, isOpen, screenWidth, screenHeight, stableSize]);

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
            (
              <>
                <div
                  className={sharedStyle.PopoverUnderlay}
                  onClick={() => {
                    setIsOpen!(false);
                  }}
                ></div>
                <div
                  className={clsx(style.Dialog, style.DialogWithFooter)}
                  ref={ref}
                  style={{
                    minWidth: width,
                    minHeight: height,
                    width: isFullscreen ? screenWidth : undefined,
                    maxWidth: isFullscreen ? screenWidth : "85%",
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
                  <div className={clsx(style.DialogBody, contentClassName)} style={contentStyle}>
                    {children}
                  </div>

                  {withFooter && footerComponent !== undefined ? (
                    footerComponent
                  ) : (
                    <DialogProviderDefaultFooter {...defaultFooterOpts} />
                  )}
                </div>
              </>
            ) as any,
            document.body,
          )}
      </>
    );
  },
);

export type DialogProviderDefaultFooterProps = {
  hasOk?: boolean;
  hasCancel?: boolean;

  okLabel?: string;
  cancelLabel?: string;

  onOk?: () => void;
  onCancel?: () => void;
};

export const DialogProviderDefaultFooter = React.memo(
  ({
    hasOk,
    hasCancel,
    okLabel,
    cancelLabel,
    onOk,
    onCancel,
  }: DialogProviderDefaultFooterProps) => {
    return (
      <div className={style.DialogFooterContainer}>
        {hasCancel && (
          <Button onClick={onCancel} variant="gray">
            {cancelLabel ?? "Cancel"}
          </Button>
        )}
        {hasOk && <Button onClick={onOk}>{okLabel ?? "OK"}</Button>}
      </div>
    );
  },
);
