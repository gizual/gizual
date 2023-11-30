import { IconCloseFilled } from "@app/assets";
import clsx from "clsx";

import style from "./modules.module.scss";

export type SimpleSearchModuleProps = {
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  hasRemoveIcon?: boolean;
  onRemove?: () => void;
};

export function SimpleSearchModule(props: SimpleSearchModuleProps) {
  const { icon, title, children, hasRemoveIcon, onRemove } = props;

  return (
    <div className={style.SearchModule}>
      <div className={style.SearchModuleIconWithText}>
        {icon && <div className={style.SearchModuleIcon}>{icon}</div>}
        {title && <div className={style.SearchModuleTitle}>{title}</div>}
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

export function PlaceHolderModule(props: PlaceHolderModuleProps) {
  const { icon, title, accentColor, ...attributes } = props;

  return (
    <div
      {...attributes}
      className={clsx(style.SearchModule, style.SearchModulePlaceholder)}
      style={{ borderColor: accentColor }}
    >
      <div className={style.SearchModuleIconWithText}>
        {icon && <div className={style.SearchModuleIcon}>{icon}</div>}
        {title && <div className={style.SearchModuleTitle}>{title}</div>}
      </div>
    </div>
  );
}
