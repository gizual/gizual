import clsx from "clsx";

import style from "./icon-button.module.scss";

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel?: string;
  colored?: boolean;
  wide?: boolean;
  border?: "right";
};

export function IconButton({
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
        style.iconButton,
        colored ? style.colored : "",
        wide ? style.wide : "",
        border === "right" ? style.borderRight : "",
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
