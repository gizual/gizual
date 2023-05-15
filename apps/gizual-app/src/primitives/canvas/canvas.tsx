import { observer } from "mobx-react-lite";
import React from "react";

import { useMainController } from "../../controllers";
import { File } from "../file/";

import style from "./canvas.module.scss";
import { CanvasViewModel } from "./canvas.vm";

export type CanvasProps = {
  vm?: CanvasViewModel;
};

function Canvas({ vm: externalVm }: CanvasProps) {
  const mainController = useMainController();

  const vm: CanvasViewModel = React.useMemo(() => {
    return externalVm || new CanvasViewModel(mainController);
  }, [externalVm]);

  return (
    <div className={style.Canvas}>
      {vm.selectedFiles.map((file) => (
        <File vm={file} key={file.fileName} />
      ))}
    </div>
  );
}

export default observer(Canvas);
