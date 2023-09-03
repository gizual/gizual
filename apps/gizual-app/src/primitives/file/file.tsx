import { useMainController } from "@app/controllers";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import { Skeleton, Spin, Tooltip } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import { ReactComponent as CloseBox } from "../../assets/icons/close-box.svg";
import { ReactComponent as Plus } from "../../assets/icons/plus.svg";
import { ReactComponent as Source } from "../../assets/icons/source.svg";
import { ReactComponent as StarFilled } from "../../assets/icons/star-filled.svg";
import { ReactComponent as StarOutline } from "../../assets/icons/star-outline.svg";
import { DialogProvider } from "../dialog-provider";
import { Editor } from "../editor";
import { FontIcon } from "../font-icon/font-icon";

import style from "./file.module.scss";
import { FileViewModel } from "./file.vm";

export type FileProps = {
  vm?: FileViewModel;
  isLoadIndicator?: boolean;
};

export const File = observer(
  React.forwardRef<HTMLDivElement, FileProps>(function File({ vm }: FileProps, ref) {
    const mainController = useMainController();
    if (!vm) return <></>;

    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const fileRef = ref;

    React.useEffect(() => {
      vm.assignCanvasRef(canvasRef);
      vm.draw();
    }, [canvasRef, vm.loading]);

    React.useEffect(() => {
      if (vm.shouldRedraw) vm.draw();
    }, [vm.shouldRedraw]);

    React.useEffect(() => {
      vm.draw();
    }, [vm._blameView.isPreview, mainController.selectedStartDate, mainController.selectedEndDate]);

    React.useEffect(() => {
      vm.assignFileRef(fileRef);
    }, [fileRef]);

    let body = (
      <DialogProvider
        trigger={
          <div className={clsx(style.FileCanvas, style.EmptyCanvas)}>
            <Plus className={style.LoadFileIcon} />
          </div>
        }
      >
        <div style={{ width: "50vw", height: "10vh" }}>File loader (Work in progress)</div>
      </DialogProvider>
    );

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
        <div className={style.File} ref={fileRef}>
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
