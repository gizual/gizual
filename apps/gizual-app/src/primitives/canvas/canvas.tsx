import {
  IconCenterFocus,
  IconLayout,
  IconMagnifyMinus,
  IconMagnifyPlus,
  IconPeople,
} from "@app/assets";
import { useMainController, useViewModelController, ViewModelController } from "@app/controllers";
import { RenderedSettingsEntry } from "@app/pages";
import { CanvasScale, createNumberSetting, createSelectSetting, useTheme } from "@app/utils";
import { Dropdown, MenuProps, Modal, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { AuthorPanel } from "../author-panel";
import sharedStyle from "../css/shared-styles.module.scss";
import { IconButton } from "../icon-button";
import { Timeline } from "../timeline";

import style from "./canvas.module.scss";
import { CanvasViewModel } from "./canvas.vm";
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

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = React.useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const [selectedWidth, setSelectedWidth] = useState(vm.canvasWidth);
  useEffect(() => {
    setSelectedWidth(vm.canvasWidth);
  }, [vm.canvasWidth]);

  console.log("Canvas.tsx");

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
          <Toolbar vm={vm} vmController={vmController} />
          <ContextModal
            vm={vm}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            selectedWidth={selectedWidth}
            setSelectedWidth={setSelectedWidth}
          />
          <InteractiveCanvas
            vm={vm}
            showModal={showModal}
            canvasRef={canvasRef}
            interactiveRef={ref}
          />
          {vmController.isAuthorPanelVisible && <AuthorPanel />}
        </div>
      </div>
    </div>
  );
}

type InteractiveCanvasProps = {
  vm: CanvasViewModel;
  showModal: () => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  interactiveRef: React.RefObject<ReactZoomPanPinchRef>;
};

const InteractiveCanvas = observer(
  ({ vm, showModal, canvasRef, interactiveRef }: InteractiveCanvasProps) => {
    const dropdownMenu: MenuProps = React.useMemo(
      () => ({
        items: [
          {
            key: "1",
            label: "Reset zoom",
            onClick: () => {
              vm.center(1);
            },
          },
          {
            key: "2",
            label: "Unselect all",
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
        ],
      }),
      [vm, showModal],
    );

    const dropdownTrigger: ("contextMenu" | "click" | "hover")[] = React.useMemo(
      () => ["contextMenu"],
      [],
    );

    return (
      <Dropdown menu={dropdownMenu} trigger={dropdownTrigger}>
        <InnerCanvas vm={vm} canvasRef={canvasRef} interactiveRef={interactiveRef} />
      </Dropdown>
    );
  },
);

type InnerCanvasProps = {
  vm: CanvasViewModel;
  canvasRef: React.RefObject<HTMLDivElement>;
  interactiveRef: React.RefObject<ReactZoomPanPinchRef>;
};

const InnerCanvas = observer(({ vm, canvasRef, interactiveRef }: InnerCanvasProps) => {
  const [isPanning, setIsPanning] = useState(false);
  const mainController = useMainController();
  return (
    <div className={style.Canvas} ref={canvasRef}>
      <TransformWrapper
        initialScale={CanvasScale.default}
        minScale={CanvasScale.min}
        maxScale={CanvasScale.max}
        initialPositionX={0}
        initialPositionY={0}
        wheel={{ smoothStep: 0.001 }}
        limitToBounds={false}
        panning={{ velocityDisabled: true }}
        ref={interactiveRef}
        onInit={() => vm.reflow()}
        onPanningStart={() => {
          setIsPanning(true);
        }}
        onPanningStop={() => {
          setIsPanning(false);
        }}
        onTransformed={(
          _ref: ReactZoomPanPinchRef,
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
            cursor: isPanning ? "grabbing" : "grab",
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
          <FileCanvas vm={vm} wrapper={interactiveRef?.current?.instance.wrapperComponent} />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
});

const Toolbar = observer(
  ({ vm, vmController }: { vm: CanvasViewModel; vmController: ViewModelController }) => {
    return (
      <div className={style.Toolbar}>
        <div className={sharedStyle.InlineColumn}>
          <Tooltip title={"Zoom out"}>
            <IconButton onClick={vm.zoomOut} aria-label="Zoom out">
              <IconMagnifyMinus className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip title={"Zoom in"}>
            <IconButton onClick={vm.zoomIn} aria-label="Zoom in">
              <IconMagnifyPlus className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip title={"Center"}>
            <IconButton onClick={vm.resetScale} aria-label="Center">
              <IconCenterFocus className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip title={"Reflow"}>
            <IconButton onClick={vm.reflow} aria-label="Reflow">
              <IconLayout className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
        </div>
        <div className={sharedStyle.InlineColumn}>
          <Tooltip title={"Show author panel"}>
            <IconButton
              onClick={vmController.toggleAuthorPanelVisibility}
              aria-label="Toggle author panel"
              colored={vmController.isAuthorPanelVisible}
            >
              <IconPeople className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    );
  },
);

type ContextModalProps = {
  vm: CanvasViewModel;
  isModalOpen: boolean;
  setIsModalOpen: (o: boolean) => void;
  selectedWidth: number;
  setSelectedWidth: (n: number) => void;
};

const ContextModal = observer(
  ({ vm, isModalOpen, setIsModalOpen, selectedWidth, setSelectedWidth }: ContextModalProps) => {
    const handleOk = React.useCallback(() => {
      setIsModalOpen(false);
      vm.drawSvg(selectedWidth, selectedAppearance);
    }, [setIsModalOpen]);

    const handleCancel = React.useCallback(() => {
      setIsModalOpen(false);
    }, [setIsModalOpen]);

    const currentTheme = useTheme();
    const [selectedAppearance, setSelectedAppearance] = useState(currentTheme);
    return (
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
    );
  },
);

export default observer(Canvas);
