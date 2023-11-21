import { useMainController } from "@app/controllers";
import { Spin } from "antd";
import { observer } from "mobx-react-lite";

import { useGlobalState } from "@giz/maestro/react";
import ChangelogMd from "../../../../../CHANGELOG.md?raw";
import { DialogProvider } from "../dialog-provider";
import { MarkdownViewer } from "../markdown-viewer";

import style from "./footer.module.scss";

function paddedNumber(num: number, length = 2) {
  return num.toString().padStart(length, "0");
}

export const Footer = observer(() => {
  const mainController = useMainController();

  const state = useGlobalState();

  const explorer = {
    jobs: paddedNumber(state.numExplorerJobs, 3),
    busyWorkers: paddedNumber(state.numExplorerWorkersBusy, 2),
    totalWorkers: paddedNumber(state.numExplorerWorkersTotal, 2),
  };

  const renderer = {
    jobs: paddedNumber(mainController.numRenderJobs, 3),
    busyWorkers: paddedNumber(mainController.numBusyRenderWorkers, 2),
    totalWorkers: paddedNumber(mainController.numRenderWorkers, 2),
  };

  return (
    <div className={style.Footer}>
      <div className={style.LeftSection}>
        <DialogProvider
          title="Changelog"
          trigger={<p>Gizual v3.0.0-alpha.11 - Build #{__COMMIT_HASH__}</p>}
        >
          <MarkdownViewer src={ChangelogMd} />
        </DialogProvider>
      </div>
      <div className={style.RightSection}>
        <Spin spinning={mainController.isBusy} />
        <p>{mainController.selectedFiles.length} files selected</p>
        <p>
          explorer: {explorer.busyWorkers}/{explorer.totalWorkers} workers | {explorer.jobs} jobs
        </p>
        <p>
          renderer: {renderer.busyWorkers}/{renderer.totalWorkers} workers | {renderer.jobs} jobs
        </p>
      </div>
    </div>
  );
});
