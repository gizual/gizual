import React from "react";

import style from "./container.module.scss";

type ContainerProps = {
  children: React.ReactNode;
  title: string;
  titleBar?: React.ReactNode | React.ReactNode[];
};

export function Container({ children, title, titleBar }: ContainerProps) {
  return (
    <div className={style.section}>
      <div className={style.sectionHead}>
        <h1>{title}</h1>
        {titleBar}
      </div>
      <div className={style.sectionBody}>{children}</div>
    </div>
  );
}
