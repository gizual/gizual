import React from "react";

import style from "./toggle-button.module.scss";

export type ToggleButtonProps = {
  ariaLabel: string;
  values: string[];
  toggleName: string;
  defaultChecked?: number;
  onChange?: (value: number) => void;
};

export function ToggleButton({ values, defaultChecked, toggleName, onChange }: ToggleButtonProps) {
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
                if (onChange) onChange(index);
              }}
            />
            <label className="labels" htmlFor={radioName}>
              {value}
            </label>
          </div>
        );
      })}
    </div>
  );
}
