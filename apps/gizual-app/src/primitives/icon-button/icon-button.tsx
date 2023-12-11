import clsx from "clsx";
import React from "react";

import style from "./icon-button.module.scss";

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  colored?: boolean;
  wide?: boolean;
  border?: "right";
};

function IconButtonI({
  className,
  onClick,
  colored,
  wide,
  border,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={clsx(
        style.IconButton,
        colored ? style.Colored : "",
        wide ? style.Wide : "",
        border === "right" ? style.BorderRight : "",
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export const IconButton = React.memo(IconButtonI);
