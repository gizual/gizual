import { Spin } from "antd";
import { observer } from "mobx-react-lite";

import ChangelogMd from "../../../../../CHANGELOG.md?raw";
import { useMainController } from "../../controllers";
import { MarkdownViewer } from "../markdown-viewer";

import { DialogProvider } from "..";
import style from "./footer.module.scss";

export const Footer = observer(() => {
  const mainController = useMainController();

  return (
    <div className={style.Footer}>
      <div className={style.LeftSection}>
        <DialogProvider
          title="Changelog"
          trigger={<p>Gizual v3.0.0-alpha.3 - Build #{__COMMIT_HASH__}</p>}
        >
          <MarkdownViewer src={ChangelogMd} />
        </DialogProvider>
      </div>
      <div className={style.RightSection}>
        <Spin spinning={mainController.isBusy} />
        <p>{mainController.selectedFiles.length} files selected</p>
        <p>
          {mainController.backendMetrics.numBusyWorkers}/{mainController.backendMetrics.numWorkers}{" "}
          backend workers
        </p>
        <p>{mainController.backendMetrics.numJobsInQueue} pending backend jobs</p>
        <p
          onClick={() => console.log("Active Render Workers:", mainController.activeRenderWorkers)}
        >
          {mainController.numActiveWorkers} render jobs
        </p>
      </div>
    </div>
  );
});
