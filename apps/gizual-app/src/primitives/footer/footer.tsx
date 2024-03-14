import { IconExplorer, IconRenderer } from "@app/assets";
import { useMainController } from "@app/controllers";
import { Loader } from "@mantine/core";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import { useMetrics } from "@giz/maestro/react";
import ChangelogMd from "../../../../../CHANGELOG.md?raw";
import { DialogProvider } from "../dialog-provider";
import { MarkdownViewer } from "../markdown-viewer";

import style from "./footer.module.scss";

function paddedNumber(num: number, length = 2) {
  return num.toString().padStart(length, "0");
}

export const Footer = observer(() => {
  const mainController = useMainController();

  const metrics = useMetrics();

  const explorer = {
    jobs: paddedNumber(metrics.numExplorerJobs, 3),
    busyWorkers: paddedNumber(metrics.numExplorerWorkersBusy, 2),
    totalWorkers: paddedNumber(metrics.numExplorerWorkersTotal, 2),
  };

  const renderer = {
    jobs: paddedNumber(metrics.numRendererJobs, 3),
    busyWorkers: paddedNumber(metrics.numRendererWorkersBusy, 2),
    totalWorkers: paddedNumber(metrics.numRendererWorkers, 2),
  };

  const version = import.meta.env.VERSION ?? "?";
  const commitHash = import.meta.env.COMMIT_HASH ?? "?";

  return (
    <div className={style.Footer}>
      <div className={style.LeftSection}>
        <DialogProvider
          title="Changelog"
          trigger={
            <p>
              Gizual {version} - Build #{commitHash}
            </p>
          }
        >
          <MarkdownViewer src={ChangelogMd} />
        </DialogProvider>
      </div>
      <div className={style.RightSection}>
        {mainController.isBusy && <Loader size="sm" />}
        <p>{metrics.numSelectedFiles} files</p>
        {explorer.totalWorkers && renderer.totalWorkers && (
          <div className={style.Metrics}>
            <IconExplorer className={style.IconExplorer} />
            <UtilizationGraph busy={explorer.busyWorkers} total={explorer.totalWorkers} />
            <span className={style.NumJobs}>{`(${explorer.jobs} jobs)`}</span>
            <span className={style.NumJobsShort}>{`(${explorer.jobs})`}</span>

            <IconRenderer className={style.IconRenderer} />
            <UtilizationGraph busy={renderer.busyWorkers} total={renderer.totalWorkers} />
            <span className={style.NumJobs}>{`(${renderer.jobs} jobs)`}</span>
            <span className={style.NumJobsShort}>{`(${renderer.jobs})`}</span>
          </div>
        )}
      </div>
    </div>
  );
});

type UtilizationGraphProps = {
  busy: number | string;
  total: number | string;
};

function UtilizationGraph({ busy, total }: UtilizationGraphProps) {
  const numBusy = Number(busy);
  const numTotal = Number(total);

  if (numTotal === 0) {
    return <></>;
  }

  let maxWidth = 320;
  // If we got more than 8 workers, we go into 2-row mode
  if (numTotal > 8) {
    maxWidth = Math.min(320, (numTotal * 6) / 2);
  }

  return (
    <div className={style.UtilizationGraph} style={{ maxWidth }}>
      {Array.from({ length: numTotal }, (_, i) => (
        <div
          key={i}
          className={clsx(
            style.UtilizationGraphItem,
            numBusy > i ? style.UtilizationGraphItem__Busy : style.UtilizationGraphItem__Idle,
          )}
        />
      ))}
    </div>
  );
}
