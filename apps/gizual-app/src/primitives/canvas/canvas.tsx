import {
  IconCenterFocus,
  IconLayout,
  IconMagnifyMinus,
  IconMagnifyPlus,
  IconPeople,
} from "@app/assets";
import { useMainController, useViewModelController } from "@app/controllers";
import { RenderedSettingsEntry } from "@app/pages";
import { createNumberSetting, createSelectSetting, useTheme } from "@app/utils";
import { Dropdown, MenuProps, Modal, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { AuthorPanel } from "../author-panel";
import sharedStyle from "../css/shared-styles.module.scss";
import { IconButton } from "../icon-button";
import { Timeline } from "../timeline";

import style from "./canvas.module.scss";
import { CanvasViewModel, MAX_ZOOM, MIN_ZOOM } from "./canvas.vm";
import { FileCanvas } from "./file-canvas";

export type CanvasProps = {
  vm?: CanvasViewModel;
};

function Canvas({ vm: externalVm }: CanvasProps) {
  const mainController = useMainController();
  const vmController = useViewModelController();

  const visibleTimeline =
    mainController.settingsController.settings.timelineSettings.displayMode.value === "visible";

  const vm: CanvasViewModel = React.useMemo(() => {
    return externalVm || new CanvasViewModel(mainController);
  }, [externalVm]);

  const ref = React.useRef<ReactZoomPanPinchRef>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    vm.setCanvasContainerRef(ref);
  }, [ref]);

  //const currentZoomLevel = Math.floor(mainController.scale * 100);

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
    {
      key: "3",
      label: "Export SVG",
      onClick: () => {
        showModal();
      },
    },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    vm.drawSvg(selectedWidth, selectedAppearance);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const [selectedWidth, setSelectedWidth] = useState(vm.canvasWidth);
  useEffect(() => {
    setSelectedWidth(vm.canvasWidth);
  }, [vm.canvasWidth]);

  const currentTheme = useTheme();
  const [selectedAppearance, setSelectedAppearance] = useState(currentTheme);
  const [isPanning, setIsPanning] = useState(false);

  return (
    <div className={style.Stage}>
      <div className={style.StageRow}>
        {visibleTimeline && (
          <>
            <Timeline vm={mainController.vmController.timelineViewModel} />
            <hr />
          </>
        )}
        <div className={style.CanvasWrapper}>
          <div className={style.Toolbar}>
            <div className={sharedStyle.InlineColumn}>
              <Tooltip title={"Zoom out"}>
                <IconButton onClick={() => vm.zoomOut()} aria-label="Zoom out">
                  <IconMagnifyMinus className={sharedStyle.ToolbarIcon} />
                </IconButton>
              </Tooltip>
              {/*<InputNumber
            value={currentZoomLevel}
            suffix={"%"}
            onBlur={(i) => vm.zoomTo(Number(i.currentTarget.value))}
            onKeyDown={(e) => e.key === "Enter" && vm.zoomTo(Number(e.currentTarget.value))}
            size={"large"}
            controls={false}
          />*/}
              <Tooltip title={"Zoom in"}>
                <IconButton onClick={() => vm.zoomIn()} aria-label="Zoom in">
                  <IconMagnifyPlus className={sharedStyle.ToolbarIcon} />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Center"}>
                <IconButton onClick={() => vm.center(1)} aria-label="Center">
                  <IconCenterFocus className={sharedStyle.ToolbarIcon} />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Reflow"}>
                <IconButton
                  onClick={() => {
                    vm.reflow();
                  }}
                  aria-label="Reflow"
                >
                  <IconLayout className={sharedStyle.ToolbarIcon} />
                </IconButton>
              </Tooltip>
            </div>
            <div className={sharedStyle.InlineColumn}>
              <Tooltip title={"Show author panel"}>
                <IconButton
                  onClick={() => vmController.toggleAuthorPanelVisibility()}
                  aria-label="Toggle author panel"
                  colored={vmController.isAuthorPanelVisible}
                >
                  <IconPeople className={sharedStyle.ToolbarIcon} />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <Modal
            title="Export to SVG"
            open={isModalOpen}
            onOk={handleOk}
            onCancel={handleCancel}
            okText="Export"
          >
            <RenderedSettingsEntry
              entry={createNumberSetting(
                "View-box width",
                "The width of the SVG view-box. Influences the number of columns within the grid.",
                selectedWidth,
              )}
              onChange={setSelectedWidth}
              onResetToDefault={() => setSelectedWidth(vm.canvasWidth)}
              isDefault={() => selectedWidth === vm.canvasWidth}
            />
            <RenderedSettingsEntry
              entry={createSelectSetting(
                "Appearance",
                "Controls the background and font colors of the exported SVG.",
                selectedAppearance,
                [
                  { value: "dark", label: "Light text on dark background" },
                  { value: "light", label: "Dark text on light background" },
                ],
              )}
              onChange={setSelectedAppearance}
              onResetToDefault={() => setSelectedAppearance(currentTheme)}
              isDefault={() => selectedAppearance === currentTheme}
            />
          </Modal>
          <Dropdown menu={{ items: dropdownItems }} trigger={["contextMenu"]}>
            <div className={style.Canvas} ref={canvasRef}>
              <TransformWrapper
                initialScale={1}
                minScale={MIN_ZOOM}
                maxScale={MAX_ZOOM}
                initialPositionX={0}
                initialPositionY={0}
                wheel={{ smoothStep: 0.001 }}
                limitToBounds={false}
                panning={{ velocityDisabled: true }}
                ref={ref}
                onPanningStart={() => {
                  setIsPanning(true);
                }}
                onPanningStop={() => {
                  setIsPanning(false);
                }}
                onTransformed={(
                  ref: ReactZoomPanPinchRef,
                  state: {
                    scale: number;
                    positionX: number;
                    positionY: number;
                  },
                ) => {
                  mainController.setScale(state.scale);
                }}
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
                    gap: "1rem",
                    width: "100%",
                    height: "100%",
                  }}
                  contentClass={isPanning ? sharedStyle.CursorDragging : sharedStyle.CursorCanDrag}
                >
                  <FileCanvas vm={vm} wrapper={ref.current?.instance.wrapperComponent} />
                </TransformComponent>
              </TransformWrapper>
            </div>
          </Dropdown>
          {vmController.isAuthorPanelVisible && <AuthorPanel />}
        </div>
      </div>
    </div>
  );
}

export default observer(Canvas);
