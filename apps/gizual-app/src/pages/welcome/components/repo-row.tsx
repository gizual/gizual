import { IconEarth, IconFolder, IconFolderZip } from "@app/assets";
import shared from "@app/primitives/css/shared-styles.module.scss";
import clsx from "clsx";

import style from "../welcome.module.scss";
import { RepoMetrics, RepoSource } from "../welcome.vm";

export type RepoRowProps = {
  source: RepoSource;
  repoName: string;
  repoSource: string;
  metrics: RepoMetrics;
};

export function RepoRow({ source, repoName, repoSource, metrics }: RepoRowProps) {
  const stars = metrics.stars > 1000 ? `${(metrics.stars / 1000).toFixed(1)}k` : metrics.stars;
  const forks = metrics.forks > 1000 ? `${(metrics.forks / 1000).toFixed(1)}k` : metrics.forks;

  return (
    <button className={style.RepoRow}>
      <div className={style.RepoRowLeft}>
        {source === "url" && <IconEarth />}
        {source === "zip" && <IconFolderZip />}
        {source === "local" && <IconFolder />}
        <div className={clsx(style.Grow, shared.FlexColumn)}>
          <p className={style.RepoRowName}>{repoName}</p>
          <p className={style.RepoRowSource}>{repoSource}</p>
        </div>
      </div>

      <div className={style.RepoRowRight}>
        <div className={style.RepoRowMetrics}>{stars} stars</div>
        <div className={style.RepoRowMetrics}>{forks} forks</div>
      </div>
    </button>
  );
}