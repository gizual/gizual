import { useTheme } from "@app/utils";
import clsx from "clsx";

import styles from "./font-icon.module.scss";

export type FontIconProps = {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  colours?: [string | null, string | null] | undefined;
};

export function FontIcon({ name, className, style, colours }: FontIconProps) {
  const theme = useTheme();
  const themeIndex = theme === "light" ? 0 : 1;
  const iconColour = colours ?? colours?.[themeIndex] ?? "var(--foreground-primary)";

  return (
    <span
      style={style}
      className={clsx(styles.Icon, name ?? "directory-closed-icon", iconColour, className)}
    ></span>
  );
}
