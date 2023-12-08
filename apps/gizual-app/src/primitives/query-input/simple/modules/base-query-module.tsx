import { IconCloseFilled } from "@app/assets";
import clsx from "clsx";

import style from "./modules.module.scss";

export type BaseQueryModuleProps = {
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  hasRemoveIcon?: boolean;
  onRemove?: () => void;
};

export function BaseQueryModule(props: BaseQueryModuleProps) {
  const { icon, title, children, hasRemoveIcon, onRemove } = props;

  return (
    <div className={style.BaseQueryModule}>
      <div className={style.QueryModuleIconWithText}>
        {icon && <div className={style.QueryModuleIcon}>{icon}</div>}
        {title && <div className={style.QueryModuleTitle}>{title}</div>}
      </div>
      {children}
      {hasRemoveIcon && <IconCloseFilled className={style.CloseIcon} onClick={onRemove} />}
    </div>
  );
}

export type PlaceHolderModuleProps = {
  icon?: React.ReactNode;
  title?: string;
  accentColor?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function PlaceholderQueryModule(props: PlaceHolderModuleProps) {
  const { icon, title, accentColor, ...attributes } = props;

  return (
    <div
      {...attributes}
      className={clsx(style.BaseQueryModule, style.PlaceholderQueryModule)}
      style={{ borderColor: accentColor }}
    >
      <div className={style.QueryModuleIconWithText}>
        {icon && <div className={style.QueryModuleIcon}>{icon}</div>}
        {title && <div className={style.QueryModuleTitle}>{title}</div>}
      </div>
    </div>
  );
}
