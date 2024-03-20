import clsx from "clsx";
import React from "react";

import style from "./button.module.scss";

type ButtonVariant = "filled" | "outline" | "gray" | "dangerous";
type ButtonSize = "small" | "regular" | "large";

const buttonVariantCSSMapping: Record<ButtonVariant, string> = {
  filled: style.ButtonFilled,
  dangerous: style.ButtonDangerous,
  outline: style.ButtonOutline,
  gray: style.ButtonGray,
};

const buttonSizeCSSMapping: Record<ButtonSize, string> = {
  small: style.ButtonSmall,
  regular: style.ButtonRegular,
  large: style.ButtonLarge,
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = "filled", ...props }, ref) => {
    return (
      <button
        className={clsx(
          className,
          style.Button,
          `${buttonVariantCSSMapping[variant]}`,
          `${buttonSizeCSSMapping[props.size ?? "regular"]}`,
        )}
        type="button"
        {...props}
        ref={ref}
      >
        {children}
      </button>
    );
  },
);
