import { usePreferredColorScheme } from "@app/hooks/use-preferred-color-scheme";
import clsx from "clsx";

import styles from "./font-icon.module.scss";

export type FontIconProps = {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  colors?: [string | null, string | null] | undefined;
  onClick?: () => void;
};

export function FontIcon({ name, className, style, colors, onClick }: FontIconProps) {
  const theme = usePreferredColorScheme();
  const themeIndex = theme === "light" ? 0 : 1;
  const iconColor = colors ?? colors?.[themeIndex] ?? "var(--foreground-primary)";

  return (
    <span
      style={style}
      className={clsx(styles.Icon, name ?? "directory-closed-icon", iconColor, className)}
      onClick={onClick}
    ></span>
  );
}
