import clsx from "clsx";

import style from "./icon-button.module.scss";

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel?: string;
  coloured?: boolean;
  wide?: boolean;
  border?: "right";
};

export function IconButton({
  className,
  onClick,
  coloured,
  wide,
  border,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={clsx(
        style.IconButton,
        coloured ? style.Coloured : "",
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
