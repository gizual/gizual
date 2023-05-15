import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import { ReactComponent as CloseBox } from "../../assets/icons/close-box.svg";
import { ReactComponent as UnknownFile } from "../../assets/icons/file-extensions/unknown.svg";
import { ReactComponent as Plus } from "../../assets/icons/plus.svg";
import { ReactComponent as StarFilled } from "../../assets/icons/star-filled.svg";
import { ReactComponent as StarOutline } from "../../assets/icons/star-outline.svg";
import { useMainController } from "../../controllers";

import { FileViewModel } from "./file.vm";
import { MockFile } from "./mock";

export type FileProps = {
  vm?: FileViewModel;
  isLoadIndicator?: boolean;
};

import EditorPopover from "../editor/editor-popover";

import style from "./file.module.scss";

function File({ vm: externalVm, isLoadIndicator }: FileProps) {
  const mainController = useMainController();
  const vm: FileViewModel = React.useMemo(() => {
    return externalVm || new FileViewModel(MockFile, mainController, {}, false, isLoadIndicator);
  }, [externalVm]);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    vm.assignCanvasRef(canvasRef);
    vm.draw();
  }, [canvasRef, vm.isLoadIndicator]);

  React.useEffect(() => {
    vm.assignFileRef(fileRef);
  }, [fileRef]);

  return (
    <>
      <div className={style.File} ref={fileRef}>
        <FileHeader vm={vm} />
        <div className={style.FileBody}>
          {vm.isLoadIndicator ? (
            <div
              className={clsx(style.FileCanvas, style.EmptyCanvas)}
              onClick={() => {
                vm.load(MockFile);
              }}
            >
              <Plus className={style.LoadFileIcon} />
            </div>
          ) : (
            <canvas className={style.FileCanvas} ref={canvasRef} />
          )}
        </div>
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
      <p className={style.FileTitle}>{vm.fileName}</p>
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
        <EditorPopover content={vm.fileContent} />
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
