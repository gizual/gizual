import { useTheme } from "@app/utils";
import styles from "./font-icon.module.scss";
import clsx from "clsx";

export type FontIconProps = {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  colors?: [string | null, string | null] | undefined;
};

export function FontIcon({ name, className, style, color, colors }: FontIconProps) {
  const theme = useTheme();
  const themeIndex = theme === "light" ? 0 : 1;
  const iconColor = colors ?? colors?.[themeIndex] ?? "var(--foreground-primary)";

  return (
    <span
      style={style}
      className={clsx(styles.icon, name ?? "question-icon", iconColor, className)}
    ></span>
  );
}
