import { IconClose } from "@app/assets";
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

export function DialogProvider({
  trigger,
  triggerClassName,
  children,
  title,
  isOpen,
  setIsOpen,
}: PopoverProviderProps) {
  if (!isOpen || !setIsOpen) [isOpen, setIsOpen] = React.useState(false);

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
            <div className={style.Dialog}>
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
}
