import clsx from "clsx";

import style from "./button.module.scss";

type ButtonVariant = "filled" | "outline" | "gray";
type ButtonSize = "small" | "regular" | "large";

const buttonVariantCSSMapping: Record<ButtonVariant, string> = {
  filled: style.ButtonFilled,
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
  variant: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ className, children, variant, ...props }: ButtonProps) {
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
    >
      {children}
    </button>
  );
}
