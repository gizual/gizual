import { observer } from "mobx-react-lite";

import style from "./radio-grid.module.scss";

type RadioGridItemProps<T> = Omit<React.HTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: T;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: T) => void;
  title: string;
  description: string;
  inputName?: string;
  comingSoon?: boolean;
};

function RadioGridItemComponent<T>({
  value,
  checked,
  disabled,
  onChange,
  title,
  description,
  inputName,
  comingSoon,
  ...rest
}: RadioGridItemProps<T>) {
  return (
    <label className={style.GridItem}>
      <input
        {...rest}
        type="radio"
        name={inputName ?? "type"}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        onClick={() => onChange(value)}
      />
      <div className={style.GridItemTile} data-disabled={disabled}>
        {comingSoon && (
          <div className={style.ComingSoonOverlay}>
            <span>Coming soon!</span>
          </div>
        )}
        <div className={style.GridItemContent}>
          <h3 className={style.GridItemTitle}>{title}</h3>
          <p className={style.GridItemDescription}>{description}</p>
        </div>
      </div>
    </label>
  );
}

export const RadioGridItem = observer(RadioGridItemComponent) as typeof RadioGridItemComponent;
