import { observer } from "mobx-react-lite";
import React from "react";

import { ReactComponent as CloseBox } from "../../assets/icons/close-box.svg";
import { ReactComponent as UnknownFile } from "../../assets/icons/file-extensions/unknown.svg";
import { ReactComponent as Source } from "../../assets/icons/source.svg";
import { ReactComponent as StarFilled } from "../../assets/icons/star-filled.svg";
import { ReactComponent as StarOutline } from "../../assets/icons/star-outline.svg";

import { FileViewModel } from "./file.vm";
import { MockFile } from "./mock";

export type FileProps = {
  vm?: FileViewModel;
};

import style from "./file.module.scss";

function File({ vm: externalVm }: FileProps) {
  const vm: FileViewModel = React.useMemo(() => {
    return externalVm || new FileViewModel(MockFile, false);
  }, [externalVm]);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    vm.assignCanvasRef(canvasRef);
    vm.draw();
  }, [canvasRef]);

  return (
    <div className={style.File}>
      <FileHeader vm={vm} />
      <div className={style.FileBody}>
        <canvas className={style.FileCanvas} ref={canvasRef} />
      </div>
    </div>
  );
}

const FileHeader = observer(({ vm }: Required<FileProps>) => {
  return (
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
        <Source className={style.FileActionIcon} />
        <CloseBox className={style.FileActionIcon} />
      </div>
    </div>
  );
});

export default observer(File);
