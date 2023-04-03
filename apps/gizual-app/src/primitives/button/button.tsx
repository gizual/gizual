import clsx from "clsx";

import style from "./button.module.scss";

type ButtonVariant = "filled" | "outline";

const buttonVariantCSSMapping: Record<ButtonVariant, string> = {
  filled: style.buttonFilled,
  outline: style.buttonOutline,
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant: ButtonVariant;
};

function Button({ className, children, variant, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(className, style.button, `${buttonVariantCSSMapping[variant]}`)}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
