import { IconChevronDown, IconEdit } from "@app/assets";
import { Button } from "@app/primitives/button";
import { IconButton } from "@app/primitives/icon-button";
import { Menu } from "@mantine/core";
import clsx from "clsx";
import React from "react";

import style from "./modules.module.scss";

export type BaseQueryModuleProps = {
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  hasSwapButton?: boolean;
  onSwap?: () => void;
  menuItems?: React.ReactNode;

  hasEditButton?: boolean;
  onEdit?: () => void;
  editButtonComponent?: React.ReactNode;
};

export function BaseQueryModule(props: BaseQueryModuleProps) {
  const {
    icon,
    title,
    children,
    hasSwapButton,
    onSwap,
    menuItems,
    hasEditButton,
    onEdit,
    editButtonComponent,
  } = props;

  return (
    <div className={style.BaseQueryModule}>
      <div className={style.QueryModuleIconWithText}>
        {icon && <div className={style.QueryModuleIcon}>{icon}</div>}
        {title && <div className={style.QueryModuleTitle}>{title}</div>}
      </div>
      {children}
      {hasSwapButton && (
        <Menu
          onChange={() => {
            onSwap?.();
          }}
          withArrow
          position="bottom"
        >
          <Menu.Target>
            <IconButton>
              <IconChevronDown className={style.CloseIcon} />
            </IconButton>
          </Menu.Target>
          {menuItems}
        </Menu>
      )}
      {hasEditButton &&
        (editButtonComponent ?? (
          <IconButton onClick={onEdit}>
            <IconEdit className={style.CloseIcon} />
          </IconButton>
        ))}
    </div>
  );
}

export type PlaceHolderModuleProps = {
  icon?: React.ReactNode;
  title?: string;
  accentColor?: string;
} & React.HTMLAttributes<HTMLButtonElement>;

export const PlaceholderQueryModule = React.forwardRef<HTMLButtonElement, PlaceHolderModuleProps>(
  ({ icon, title, accentColor, ...attributes }, ref) => {
    return (
      <Button
        {...attributes}
        className={clsx(style.BaseQueryModule, style.PlaceholderQueryModule)}
        style={{ borderColor: accentColor }}
        ref={ref}
      >
        <div className={style.QueryModuleIconWithText}>
          {icon && <div className={style.QueryModuleIcon}>{icon}</div>}
          {title && <div className={style.QueryModuleTitle}>{title}</div>}
        </div>
      </Button>
    );
  },
);
