import React from "react";

import style from "./toggle-button.module.scss";

export type ToggleButtonProps<T> = {
  ariaLabel: string;
  values: readonly T[];
  toggleName: string;
  defaultChecked?: number;
  onChange?: (value: T) => void;
};

export function ToggleButton<T>({
  values,
  defaultChecked,
  toggleName,
  onChange,
}: ToggleButtonProps<T>) {
  const [selected, setSelected] = React.useState(defaultChecked ?? 0);

  return (
    <div className={style.selector}>
      {values.map((value, index) => {
        const radioName = `radio-${toggleName}-${index}`;
        const isSelected = selected === index;
        return (
          <div className={style.radioButton} key={index}>
            <input
              id={radioName}
              type="radio"
              name={`toggle-button-radio-${toggleName}`}
              defaultChecked={isSelected}
              onChange={() => {
                setSelected(index);
                if (onChange) onChange(values[index]);
              }}
            />
            <label className="labels" htmlFor={radioName}>
              {`${value}`}
            </label>
          </div>
        );
      })}
    </div>
  );
}
