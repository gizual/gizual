import { Dropdown, InputNumber, MenuProps } from "antd";
import { observer } from "mobx-react-lite";
import React from "react";
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { ReactComponent as Center } from "../../assets/icons/center-focus.svg";
import { ReactComponent as MagnifyMinus } from "../../assets/icons/magnify-minus-outline.svg";
import { ReactComponent as MagnifyPlus } from "../../assets/icons/magnify-plus-outline.svg";
import { useMainController } from "../../controllers";
import sharedStyle from "../css/shared-styles.module.scss";
import { File } from "../file/";
import { IconButton } from "../icon-button";
import { Timeline } from "../timeline";

import style from "./canvas.module.scss";
import { CanvasViewModel, MAX_ZOOM, MIN_ZOOM } from "./canvas.vm";

export type CanvasProps = {
  vm?: CanvasViewModel;
};

function Canvas({ vm: externalVm }: CanvasProps) {
  const mainController = useMainController();

  const vm: CanvasViewModel = React.useMemo(() => {
    return externalVm || new CanvasViewModel(mainController);
  }, [externalVm]);

  const ref = React.useRef<ReactZoomPanPinchRef>(null);
  const fileRefs = React.useRef([]);

  React.useEffect(() => {
    fileRefs.current = vm.selectedFiles.map((_, i) => fileRefs.current[i] ?? React.createRef());
  }, [vm.selectedFiles]);

  React.useEffect(() => {
    vm.setCanvasContainerRef(ref);
  }, [ref]);

  const currentZoomLevel = Math.floor(mainController.scale * 100);

  const dropdownItems: MenuProps["items"] = [
    {
      key: "1",
      label: "Reset zoom",
      onClick: () => {
        vm.center(1);
      },
    },
    {
      key: "2",
      label: "Unload all",
      onClick: () => {
        vm.unloadAllFiles();
      },
    },
  ];

  return (
    <div className={style.Stage}>
      <Timeline />
      <div className={style.Toolbar}>
        <div className={sharedStyle.inlineRow}>
          <IconButton onClick={() => vm.zoomOut()}>
            <MagnifyMinus className={sharedStyle.toolbarIcon} />
          </IconButton>
          <InputNumber
            value={currentZoomLevel}
            suffix={"%"}
            onChange={(i) => vm.zoomTo(i)}
            size={"large"}
            controls={false}
          />
          <IconButton onClick={() => vm.zoomIn()}>
            <MagnifyPlus className={sharedStyle.toolbarIcon} />
          </IconButton>
          <IconButton onClick={() => vm.center(1)}>
            <Center className={sharedStyle.toolbarIcon} />
          </IconButton>
        </div>
      </div>
      <Dropdown menu={{ items: dropdownItems }} trigger={["contextMenu"]}>
        <div className={style.Canvas}>
          <TransformWrapper
            initialScale={1}
            minScale={MIN_ZOOM}
            maxScale={MAX_ZOOM}
            initialPositionX={0}
            initialPositionY={0}
            wheel={{ smoothStep: 0.005 }}
            limitToBounds={false}
            ref={ref}
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
                alignItems: "flex-start",
                justifyContent: "center",
                gap: "calc(1rem * var(--canvas-scale-reverse)",
                width: "100%",
                height: "100%",
              }}
            >
              {vm.selectedFiles.map((file, index) => (
                <File ref={vm.getFileRef(file.fileName)} vm={file} key={file.fileName} />
              ))}
            </TransformComponent>
          </TransformWrapper>
        </div>
      </Dropdown>
    </div>
  );
}

export default observer(Canvas);
