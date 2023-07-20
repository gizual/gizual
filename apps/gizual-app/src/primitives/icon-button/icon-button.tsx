import clsx from "clsx";

import style from "./icon-button.module.scss";

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  onClick: () => void;
  colored?: boolean;
  wide?: boolean;
  border?: "right";
};

export function IconButton(props: IconButtonProps) {
  const { className, onClick, colored, wide, border, children } = props;
  return (
    <button
      className={clsx(
        style.iconButton,
        colored ? style.colored : "",
        wide ? style.wide : "",
        border === "right" ? style.borderRight : "",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
