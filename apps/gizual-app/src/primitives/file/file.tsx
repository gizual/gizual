import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import { ReactComponent as CloseBox } from "../../assets/icons/close-box.svg";
import { ReactComponent as UnknownFile } from "../../assets/icons/file-extensions/unknown.svg";
import { ReactComponent as Plus } from "../../assets/icons/plus.svg";
import { ReactComponent as Source } from "../../assets/icons/source.svg";
import { ReactComponent as StarFilled } from "../../assets/icons/star-filled.svg";
import { ReactComponent as StarOutline } from "../../assets/icons/star-outline.svg";
import { useMainController } from "../../controllers";
import { DialogProvider } from "../dialog-provider";
import { Editor } from "../editor";

import style from "./file.module.scss";
import { FileViewModel } from "./file.vm";

export type FileProps = {
  vm?: FileViewModel;
  isLoadIndicator?: boolean;
};

function File({ vm, isLoadIndicator }: FileProps) {
  const mainController = useMainController();
  if (!vm) return;

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    vm.assignCanvasRef(canvasRef);
    vm.draw();
  }, [canvasRef, vm.loading]);

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
      body = <div>Loading</div>;
    } else {
      body = <canvas className={style.FileCanvas} ref={canvasRef} />;
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
}

export type FileHeaderProps = {
  vm: FileViewModel;
};

const FileHeader = observer(({ vm }: FileHeaderProps) => {
  return vm.isLoadIndicator ? (
    <div className={style.FileHead} />
  ) : (
    <div className={style.FileHead}>
      <UnknownFile className={style.FileIcon} />
      <p className={style.FileTitle} title={vm.fileName}>
        {vm.fileName}
      </p>
      {vm.isFavourite ? (
        <StarFilled
          className={style.FavouriteIcon}
          onClick={() => {
            vm.unsetFavourite();
          }}
        />
      ) : (
        <StarOutline
          className={style.FavouriteIconUnfilled}
          onClick={() => {
            vm.setFavourite();
          }}
        />
      )}
      <div className={style.FileActions}>
        <DialogProvider
          trigger={
            <div>
              <Source className={style.FileIcon} />
            </div>
          }
        >
          <Editor file={vm} />
        </DialogProvider>
        <CloseBox
          className={style.FileActionIcon}
          onClick={() => {
            vm.close();
          }}
        />
      </div>
    </div>
  );
});

export default observer(File);
