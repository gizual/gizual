import clsx from "clsx";

import style from "./button.module.scss";

type ButtonVariant = "filled" | "outline" | "gray";

const buttonVariantCSSMapping: Record<ButtonVariant, string> = {
  filled: style.ButtonFilled,
  outline: style.ButtonOutline,
  gray: style.ButtonGray,
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant: ButtonVariant;
};

export function Button({ className, children, variant, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(className, style.Button, `${buttonVariantCSSMapping[variant]}`)}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
