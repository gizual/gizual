import { useTheme } from "@app/utils";
import clsx from "clsx";

import styles from "./font-icon.module.scss";

export type FontIconProps = {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  colors?: [string | null, string | null] | undefined;
};

export function FontIcon({ name, className, style, colors }: FontIconProps) {
  const theme = useTheme();
  const themeIndex = theme === "light" ? 0 : 1;
  const iconColor = colors ?? colors?.[themeIndex] ?? "var(--foreground-primary)";

  return (
    <span
      style={style}
      className={clsx(styles.icon, name ?? "directory-closed-icon", iconColor, className)}
    ></span>
  );
}
