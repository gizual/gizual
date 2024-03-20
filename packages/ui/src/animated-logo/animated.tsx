import clsx from "clsx";
import { HTMLAttributes } from "react";

import style from "./animated-logo.module.scss";

export type AnimatedLogoProps = {
  animationState: "idle" | "loading" | "loading-finished";
} & HTMLAttributes<HTMLDivElement>;

export function AnimatedLogo({ className, animationState }: AnimatedLogoProps) {
  return (
    <div className={style.Center}>
      <svg className={style.GitLineArt} viewBox={"0 0 800 100"} width={"100%"} height={100}>
        <line className={style.GitLineMain} x1={0} x2={800} y1={40} y2={40} strokeWidth={6} />
        <line className={style.GitLineBranch} x1={315} x2={342.5} y1={40} y2={72} strokeWidth={6} />
      </svg>

      <div className={clsx(style.Container, className)}>
        <span className={style.TitleStroke}>Gizual</span>
        <h2
          className={style.TitleIdleWave}
          style={{
            animationDuration:
              animationState === "loading" || animationState === "loading-finished" ? "2s" : "5s",
          }}
        >
          Gizual
        </h2>
        <span
          className={clsx(
            style.LoadingFinishedWave,
            animationState === "loading-finished" && style.LoadingFinishedWaveAnimate,
          )}
        >
          Gizual
        </span>
        <span className={style.TitleColorBg}>Gizual</span>
      </div>
    </div>
  );
}
