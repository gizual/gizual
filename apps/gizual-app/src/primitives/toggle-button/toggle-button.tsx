import React from "react";

import style from "./toggle-button.module.scss";

export type ToggleButtonProps<T> = {
  ariaLabel: string;
  values: readonly T[];
  toggleName: string;
  selected?: T;
  onChange?: (value: T) => void;
};

export function ToggleButton<T>({ values, selected, toggleName, onChange }: ToggleButtonProps<T>) {
  const [selectedItem, setSelectedItem] = React.useState(selected ?? values[0]);

  return (
    <div className={style.selector}>
      {values.map((value, index) => {
        const radioName = `radio-${toggleName}-${index}`;
        const isSelected = selectedItem === values[index];
        return (
          <div className={style.radioButton} key={index}>
            <input
              id={radioName}
              type="radio"
              name={`toggle-button-radio-${toggleName}`}
              checked={isSelected}
              onChange={() => {
                setSelectedItem(values.find((v) => v === value) ?? values[0]);
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
