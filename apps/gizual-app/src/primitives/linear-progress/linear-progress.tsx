import { Progress } from "antd";
import clsx from "clsx";

import style from "./linear-progress.module.scss";

export type LinearProgressProps = {
  className: string;
};

export function LinearProgress({ className }: LinearProgressProps) {
  return <Progress percent={50} showInfo={false} className={clsx(style.Progress, className)} />;
}
