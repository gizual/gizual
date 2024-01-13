import { IconFullscreen } from "@app/assets";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { IconButton } from "@app/primitives/icon-button";
import React from "react";

import style from "./container.module.scss";

type ContainerProps = {
  children: React.ReactNode;
  title: string;
  titleBar?: React.ReactNode | React.ReactNode[];
};

export function Container({ children, title, titleBar }: ContainerProps) {
  return (
    <div className={style.Section}>
      <div className={style.SectionHead}>
        <h1>{title}</h1>
        {titleBar}
        <div className={style.SectionRight}>
          <DialogProvider
            trigger={
              <IconButton>
                <IconFullscreen />
              </IconButton>
            }
            title={title}
            contentClassName={style.DialogContent}
          >
            {children}
          </DialogProvider>
        </div>
      </div>
      <div className={style.SectionBody}>{children}</div>
    </div>
  );
}
