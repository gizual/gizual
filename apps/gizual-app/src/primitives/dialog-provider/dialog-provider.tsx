import { IconClose, IconQuestion } from "@app/assets";
import { useMediaQuery } from "@app/hooks/use-media-query";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";
import { createPortal } from "react-dom";

import { Button } from "../button";
import sharedStyle from "../css/shared-styles.module.scss";
import { IconButton } from "../icon-button";

import style from "./dialog-provider.module.scss";

type PopoverProviderProps = {
  trigger: React.ReactNode | React.ReactNode[];
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  stableSize?: boolean;
} & PortalProps;

type PortalProps = {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  wrapperClassName?: string;
  wrapperStyle?: React.CSSProperties;
  children: React.ReactNode | React.ReactNode[];
  title?: string;
  withFooter?: boolean;
  footerComponent?: React.ReactNode | React.ReactNode[];
  defaultFooterOpts?: DialogProviderDefaultFooterProps;
  withoutDialogStyles?: boolean;
  withHelp?: boolean;
  onHelpClick?: () => void;
};

const DialogProvider = observer(
  ({
    trigger,
    triggerClassName,
    triggerStyle,
    isOpen,
    setIsOpen,
    ...portalProps
  }: PopoverProviderProps) => {
    if (isOpen === undefined || setIsOpen === undefined)
      [isOpen, setIsOpen] = React.useState(false);

    return (
      <>
        <div
          className={triggerClassName ?? style.Trigger}
          onClick={() => {
            setIsOpen!(true);
          }}
          style={triggerStyle}
        >
          {trigger}
        </div>
        <DialogPortal {...portalProps} isOpen={isOpen} setIsOpen={setIsOpen} />
      </>
    );
  },
);

const DialogPortal = observer(
  ({
    isOpen,
    setIsOpen,
    contentClassName,
    contentStyle,
    wrapperClassName,
    wrapperStyle,
    children,
    title,
    withFooter,
    footerComponent,
    defaultFooterOpts,
    withoutDialogStyles,
    withHelp,
    onHelpClick,
  }: PortalProps) => {
    const ref = React.useRef<HTMLDivElement>(null);

    const narrowWidth = useMediaQuery({ max: 900 }, "width");
    const narrowHeight = useMediaQuery({ max: 700 }, "height");

    const isFullScreen = narrowHeight || narrowWidth;

    return (
      <>
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
                  className={clsx(style.Dialog, style.DialogWithFooter, wrapperClassName)}
                  ref={ref}
                  style={
                    withoutDialogStyles
                      ? { ...wrapperStyle }
                      : {
                          width: isFullScreen ? "100dvw" : undefined,
                          maxWidth: isFullScreen ? "100dvw" : "min(1500px, 95dvw)",
                          minWidth: isFullScreen ? "100dvw" : "min(80dvw, 1500px)",
                          height: isFullScreen ? "100dvh" : undefined,
                          maxHeight: isFullScreen ? "100dvh" : "min(1200px, 95dvh)",
                          minHeight: isFullScreen ? "100dvh" : "min(80dvh, 400px)",
                          ...wrapperStyle,
                        }
                  }
                >
                  <div className={style.DialogHead}>
                    <h2 className={style.DialogTitle}>{title}</h2>
                    <div className={style.DialogHead__Right}>
                      {withHelp && (
                        <IconButton
                          className={style.ActionButton}
                          onClick={() => {
                            onHelpClick?.();
                          }}
                        >
                          <IconQuestion />
                        </IconButton>
                      )}
                      <IconButton
                        className={clsx(sharedStyle.CloseButton, style.CloseButton)}
                        onClick={() => {
                          setIsOpen!(false);
                        }}
                      >
                        <IconClose />
                      </IconButton>
                    </div>
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

type DialogProviderDefaultFooterProps = {
  hasOk?: boolean;
  hasCancel?: boolean;

  okLabel?: string;
  cancelLabel?: string;

  onOk?: () => void;
  onCancel?: () => void;
};

const DialogProviderDefaultFooter = observer(
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

export { DialogPortal, DialogProvider, DialogProviderDefaultFooter };
