import { Select as AntdSelect, SelectProps as AntdSelectProps } from "antd";
import clsx from "clsx";

import style from "./select.module.scss";

export type SelectProps = {
  icon?: React.ReactNode;
  componentStyle?: React.CSSProperties;
} & AntdSelectProps;

export function Select(props: SelectProps) {
  const { icon, className, style: customStyle, componentStyle, ...antdProps } = props;

  return (
    <div className={clsx(style.SelectWrapper, className)} style={customStyle}>
      {icon && <div className={style.SelectIconWrapper}>{icon}</div>}
      <AntdSelect {...antdProps} className={style.SelectBox} style={componentStyle} />
    </div>
  );
}
