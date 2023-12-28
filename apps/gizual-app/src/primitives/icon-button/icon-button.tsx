import clsx from "clsx";
import React from "react";
import { forwardRef } from "react";

import style from "./icon-button.module.scss";

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  colored?: boolean;
  wide?: boolean;
  border?: "right";
};

const IconButtonI = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, onClick, ariaLabel, colored, wide, border, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          style.IconButton,
          colored ? style.Colored : "",
          wide ? style.Wide : "",
          border === "right" ? style.BorderRight : "",
          className,
        )}
        onClick={onClick}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </button>
    );
  },
);

export const IconButton = React.memo(IconButtonI);
