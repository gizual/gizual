import { useMainController } from "@app/controllers";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import { isRef } from "@app/utils/tsutils";
import { Skeleton, Spin, Tooltip } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import { ReactComponent as CloseBox } from "../../assets/icons/close-box.svg";
import { ReactComponent as Source } from "../../assets/icons/source.svg";
import { ReactComponent as StarFilled } from "../../assets/icons/star-filled.svg";
import { ReactComponent as StarOutline } from "../../assets/icons/star-outline.svg";
import { DialogProvider } from "../dialog-provider";
import { Editor } from "../editor";
import { FontIcon } from "../font-icon/font-icon";

import style from "./file.module.scss";
import { FileViewModel } from "./file.vm";

export type FileProps = {
  parentContainer: Element | null;
  vm: FileViewModel;
  isLoadIndicator?: boolean;
};

export const File = observer(
  React.forwardRef<HTMLDivElement, FileProps>(function File(
    { vm, parentContainer }: FileProps,
    ref,
  ) {
    if (!isRef(ref))
      throw new Error(
        "The File component only supports valid React refs created through `createRef` or `useRef`.",
      );

    const mainController = useMainController();
    const settingsController = mainController.settingsController;

    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    React.useEffect(() => {
      vm.assignCanvasRef(canvasRef);
      vm.draw();
    }, [canvasRef, vm.loading]);

    React.useEffect(() => {
      if (vm.shouldRedraw) vm.draw();
    }, [vm.shouldRedraw]);

    React.useEffect(() => {
      vm.draw();
    }, [
      vm._blameView.isPreview,
      mainController.selectedStartDate,
      mainController.selectedEndDate,
      vm.shouldRender,
    ]);

    // Attach IntersectionObserver on load, detach on dispose.
    React.useEffect(() => {
      if (!ref) return;

      const ioOptions: IntersectionObserverInit = {
        root: parentContainer,
        rootMargin: `${settingsController.visualisationSettings.canvas.rootMargin.value}px`,
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      };

      const ioCallback: IntersectionObserverCallback = (entries: IntersectionObserverEntry[]) => {
        if (entries.length <= 0) return;
        vm.setRenderPriority(entries[0].intersectionRatio * 100);
      };

      const ioObserver = new IntersectionObserver(ioCallback, ioOptions);
      ioObserver.observe(ref.current);
      return () => {
        ioObserver.disconnect();
        //ioObserver.unobserve(ref.current);
        vm.dispose();
      };
    }, []);

    React.useEffect(() => {
      vm.assignFileRef(ref);
    }, [ref]);

    // This should never be displayed.
    let body: React.ReactElement = <div>An unknown error occurred.</div>;

    if (!vm._isLoadIndicator) {
      if (vm.loading) {
        body = (
          <div>
            <Skeleton active />
          </div>
        );
      } else if (vm.isValid) {
        body = <canvas className={style.FileCanvas} ref={canvasRef} />;
      } else {
        body = (
          <div>
            Invalid file.
            <Skeleton style={{ marginTop: "1rem" }} />
          </div>
        );
      }
    }

    return (
      <>
        <div className={style.File} ref={ref}>
          <FileHeader vm={vm} />
          <div className={style.FileBody}>{body}</div>
        </div>
      </>
    );
  }),
);

export type FileHeaderProps = {
  vm: FileViewModel;
};

const FileHeader = observer(({ vm }: FileHeaderProps) => {
  return vm.isLoadIndicator ? (
    <div className={style.FileHead} />
  ) : (
    <div className={style.FileHead}>
      <div className={style.FileHeadLeft}>
        {vm._blameView.isPreview ? (
          <div className={style.LoadingContainer}>
            <Spin size={"default"} />
          </div>
        ) : (
          <FontIcon
            className={style.FontIcon}
            name={vm.fileInfo!.fileIcon}
            colors={vm.fileInfo!.fileIconColor!}
          />
        )}
        <p className={style.FileTitle} title={vm.fileName}>
          {vm.fileName}
        </p>
      </div>
      <div className={style.FileActions}>
        {vm.isFavourite ? (
          <Tooltip title="Remove from favourites">
            <StarFilled
              className={clsx(style.FavouriteIcon, sharedStyle.pointer)}
              onClick={() => {
                vm.unsetFavourite();
              }}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Add to favourites">
            <StarOutline
              className={clsx(style.FavouriteIconUnfilled, sharedStyle.pointer)}
              onClick={() => {
                vm.setFavourite();
              }}
            />
          </Tooltip>
        )}
        <DialogProvider
          trigger={
            <Tooltip title="Show file content">
              <div className={sharedStyle.pointer}>
                <Source className={style.FileIcon} />
              </div>
            </Tooltip>
          }
        >
          <Editor file={vm} />
        </DialogProvider>

        <Tooltip title="Close file">
          <div className={sharedStyle.pointer}>
            <CloseBox
              className={style.FileActionIcon}
              onClick={() => {
                vm.close();
              }}
            />
          </div>
        </Tooltip>
      </div>
    </div>
  );
});
