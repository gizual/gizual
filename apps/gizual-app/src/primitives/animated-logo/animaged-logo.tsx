import clsx from "clsx";
import { HTMLAttributes } from "react";

import style from "./animated-logo.module.scss";

export type AnimatedLogoProps = HTMLAttributes<HTMLDivElement>;

export function AnimatedLogo({ className }: AnimatedLogoProps) {
  return (
    <div className={style.Center}>
      <svg className={style.GitLineArt} viewBox={"0 0 800 100"} width={"100%"} height={100}>
        <line className={style.GitLineMain} x1={0} x2={800} y1={40} y2={40} strokeWidth={6} />
        <line className={style.GitLineBranch} x1={275} x2={322.5} y1={40} y2={72} strokeWidth={6} />
      </svg>

      <div className={clsx(style.Container, className)}>
        <h2>Gizual</h2>
        <h2>Gizual</h2>
      </div>
    </div>
  );
}
