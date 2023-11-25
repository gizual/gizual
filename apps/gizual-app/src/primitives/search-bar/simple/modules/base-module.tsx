import { IconCloseFilled } from "@app/assets";
import { useMainController } from "@app/controllers";

import style from "./modules.module.scss";

export type SimpleSearchModuleProps = {
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  hasRemoveIcon?: boolean;
};

export function SimpleSearchModule(props: SimpleSearchModuleProps) {
  const mainController = useMainController();
  const { icon, title, children, hasRemoveIcon } = props;

  return (
    <div className={style.SearchModule}>
      <div className={style.SearchModuleIconWithText}>
        {icon && <div className={style.SearchModuleIcon}>{icon}</div>}
        {title && <div className={style.SearchModuleTitle}>{title}</div>}
      </div>
      {children}
      {hasRemoveIcon && (
        <IconCloseFilled
          className={style.CloseIcon}
          onClick={() => {
            mainController.displayNotification({
              message: "TODO! :)",
              description: "This feature has not been implemented",
              duration: 1,
            });
          }}
        />
      )}
    </div>
  );
}
