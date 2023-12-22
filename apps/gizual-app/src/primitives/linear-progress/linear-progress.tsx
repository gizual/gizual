import { Progress } from "@mantine/core";
import clsx from "clsx";

import style from "./linear-progress.module.scss";

export type LinearProgressProps = {
  className: string;
};

export function LinearProgress({ className }: LinearProgressProps) {
  return <Progress value={50} className={clsx(style.Progress, className)} />;
}
