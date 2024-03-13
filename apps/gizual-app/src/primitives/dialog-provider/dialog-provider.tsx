import { IconClose } from "@app/assets";
import { useMediaQuery } from "@app/hooks/use-media-query";
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
  }: PopoverProviderProps) => {
    if (isOpen === undefined || setIsOpen === undefined)
      [isOpen, setIsOpen] = React.useState(false);

    const ref = React.useRef<HTMLDivElement>(null);

    const narrowWidth = useMediaQuery({ max: 900 }, "width");
    const narrowHeight = useMediaQuery({ max: 700 }, "height");
    const isFullScreen = narrowHeight || narrowWidth;

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
                    width: isFullScreen ? "100dvw" : undefined,
                    maxWidth: isFullScreen ? "100dvw" : "min(1500px, 95dvw)",
                    minWidth: isFullScreen ? "100dvw" : "min(80dvw, 1500px)",
                    height: isFullScreen ? "100dvh" : undefined,
                    maxHeight: isFullScreen ? "100dvh" : "min(1200px, 95dvh)",
                    minHeight: isFullScreen ? "100dvh" : "min(80dvh, 400px)",
                  }}
                >
                  <div className={style.DialogHead}>
                    <h2 className={style.DialogTitle}>{title}</h2>
                    <IconButton
                      className={clsx(sharedStyle.CloseButton, style.CloseButton)}
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

                  {withFooter &&
                    (footerComponent === undefined ? (
                      <DialogProviderDefaultFooter {...defaultFooterOpts} />
                    ) : (
                      footerComponent
                    ))}
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
