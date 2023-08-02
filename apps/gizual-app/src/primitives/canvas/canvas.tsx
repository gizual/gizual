import { observer } from "mobx-react-lite";
import React from "react";

import { useMainController } from "../../controllers";
import { File } from "../file/";
import { Timeline } from "../timeline";

import style from "./canvas.module.scss";
import { CanvasViewModel } from "./canvas.vm";

import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

export type CanvasProps = {
  vm?: CanvasViewModel;
};

function Canvas({ vm: externalVm }: CanvasProps) {
  const mainController = useMainController();

  const vm: CanvasViewModel = React.useMemo(() => {
    return externalVm || new CanvasViewModel(mainController);
  }, [externalVm]);

  return (
    <div className={style.Stage}>
      <Timeline />
      <div className={style.Canvas}>
        <TransformWrapper
          initialScale={1}
          initialPositionX={0}
          initialPositionY={0}
          onTransformed={(
            ref: ReactZoomPanPinchRef,
            state: {
              scale: number;
              positionX: number;
              positionY: number;
            },
          ) => mainController.setScale(state.scale)}
        >
          <TransformComponent
            wrapperStyle={{
              width: "100%",
              height: "100%",
            }}
            contentStyle={{
              flexFlow: "row wrap",
              gap: "calc(1rem * var(--canvas-scale-reverse)",
              width: "100%",
              height: "100%",
            }}
          >
            {vm.selectedFiles.map((file) => (
              <File vm={file} key={file.fileName} />
            ))}
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
}

export default observer(Canvas);
