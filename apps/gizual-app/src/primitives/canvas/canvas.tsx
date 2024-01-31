import { useMainController, useViewModelController } from "@app/controllers";
import { CanvasScale } from "@app/utils";
import { ContextMenuContent, useContextMenu } from "mantine-contextmenu";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { useBlocks } from "@giz/maestro/react";
import { AuthorPanel } from "../author-panel";
import sharedStyle from "../css/shared-styles.module.scss";
import { Timeline } from "../timeline";

import type { CanvasContextProps } from "./canvas.context";
import { CanvasContext } from "./canvas.context";
import style from "./canvas.module.scss";
import { CanvasViewModel } from "./canvas.vm";
import { LegendComponent, MasonryCanvas, Toolbar } from "./components";
import { ContextModal } from "./components/context-modal";
import { MiniMap, MiniMapContent } from "./minimap";

export type CanvasProps = {
  vm?: CanvasViewModel;
} & Partial<CanvasContextProps>;

/**
 * This is the main component that wraps around the interactive canvas element.
 * It also contains the timeline and toolbar elements.
 */
function Canvas({ vm: externalVm, ...contextProps }: CanvasProps) {
  const mainController = useMainController();
  const vmController = useViewModelController();

  const visibleTimeline =
    mainController.settingsController.settings.timelineSettings.displayMode.value === "visible";

  const vm: CanvasViewModel = React.useMemo(() => {
    return externalVm || new CanvasViewModel(mainController);
  }, [externalVm]);

  const ref = React.useRef<ReactZoomPanPinchRef>(null);

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

  return (
    <div className={style.Stage}>
      <ContextModal
        vm={vm}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedWidth={selectedWidth}
        setSelectedWidth={setSelectedWidth}
      />
      <div className={style.StageRow}>
        {visibleTimeline && (
          <>
            <Timeline vm={mainController.vmController.timelineViewModel} />
            <hr />
          </>
        )}
        <div className={style.CanvasWrapper}>
          <CanvasContext.Provider
            value={{ useBlocks: useBlocks, debugLayout: false, ...contextProps }}
          >
            <Toolbar vm={vm} vmController={vmController} />
            <InteractiveCanvas vm={vm} showModal={showModal} interactiveRef={ref} />
          </CanvasContext.Provider>
          {vmController.isAuthorPanelVisible && <AuthorPanel />}
        </div>
      </div>
    </div>
  );
}

type InteractiveCanvasProps = {
  vm: CanvasViewModel;
  interactiveRef: React.RefObject<ReactZoomPanPinchRef>;
  showModal: () => void;
};

/**
 * This is the main canvas element that contains the individual blocks, wrapped inside
 * the `react-zoom-pan-pinch` wrapper component.
 */
const InteractiveCanvas = observer<any, HTMLDivElement>(
  ({ vm, interactiveRef, showModal }: InteractiveCanvasProps, ref) => {
    const { showContextMenu } = useContextMenu();
    const contextMenu: ContextMenuContent = React.useMemo(
      () => [
        {
          key: "1",
          title: "Reset zoom",
          onClick: () => {
            vm.center(1);
          },
        },
        {
          key: "2",
          title: "Unselect all",
          onClick: () => {
            vm.unloadAllFiles();
          },
        },
        {
          key: "3",
          title: "Export SVG",
          onClick: () => {
            showModal();
          },
        },
      ],
      [vm, showModal],
    );

    return (
      <InnerCanvas
        vm={vm}
        ref={ref}
        interactiveRef={interactiveRef}
        onContextMenu={showContextMenu(contextMenu)}
      />
    );
  },
  { forwardRef: true },
);

type InnerCanvasProps = {
  vm: CanvasViewModel;
  interactiveRef: React.RefObject<ReactZoomPanPinchRef>;
} & React.HTMLAttributes<HTMLDivElement>;

const MINIMAP_HIDE_ON_HOVER = true;
const LEGEND_HIDE_ON_HOVER = true;

const CANVAS_PADDING = 16;

const InnerCanvas = observer<any, HTMLDivElement>(
  ({ vm, interactiveRef, ...defaultProps }: InnerCanvasProps, ref) => {
    const mainController = useMainController();
    const [isPanning, setIsPanning] = useState(false);
    const [state, setState] = useState<{ scale: number; positionX: number; positionY: number }>({
      scale: 1,
      positionX: 0,
      positionY: 0,
    });

    const [showMinimap, setShowMinimap] = useState(true);
    const [showLegend, setShowLegend] = useState(true);

    const wrapperWidth = interactiveRef?.current?.instance.wrapperComponent?.clientWidth ?? 0;
    //const contentHeight = interactiveRef?.current?.instance.contentComponent?.clientHeight ?? 0;
    const wrapperHeight = interactiveRef?.current?.instance.wrapperComponent?.clientHeight ?? 0;

    const { debugLayout } = React.useContext(CanvasContext);

    const legendWidth = Math.min(wrapperWidth / 10 + 100, 300);
    const legendHeight = 50;

    // TODO: This is counter-intuitive because the minimap component decides on it's dimensions
    // even if we pass it a width and height. We should probably fix this in the minimap component.
    const minimapWidth = Math.min(wrapperWidth / 10 + 100, 300);
    const minimapHeight = wrapperHeight - legendHeight; //Math.min(contentHeight / 10, wrapperHeight);

    return (
      <div
        ref={ref}
        className={style.Canvas}
        {...defaultProps}
        style={{ padding: CANVAS_PADDING }}
        onMouseMove={(e) => {
          // Get position relative to element
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          if (
            MINIMAP_HIDE_ON_HOVER &&
            y < minimapHeight + CANVAS_PADDING &&
            x > rect.width - minimapWidth - CANVAS_PADDING
          ) {
            setShowMinimap(false);
          } else {
            setShowMinimap(true);
          }

          if (
            LEGEND_HIDE_ON_HOVER &&
            y > wrapperHeight - legendHeight + CANVAS_PADDING &&
            x > rect.width - legendWidth - CANVAS_PADDING
          ) {
            setShowLegend(false);
          } else {
            setShowLegend(true);
          }
        }}
      >
        {debugLayout && (
          <div className={style.DebugOverlay}>
            <p className={sharedStyle["Text-Bold"]}>Canvas Debug Panel</p>
            <code>{`wrapper: ${interactiveRef.current?.instance.wrapperComponent?.clientWidth}px × ${interactiveRef.current?.instance.wrapperComponent?.clientHeight}px`}</code>
            <code>{`transform-component: ${interactiveRef.current?.instance.contentComponent?.clientWidth}px × ${interactiveRef.current?.instance.contentComponent?.clientHeight}px`}</code>
            <code>{`css transform: scale=${state.scale}, positionX=${state.positionX}px, positionY=${state.positionY}`}</code>
          </div>
        )}
        <TransformWrapper
          initialScale={CanvasScale.default}
          minScale={CanvasScale.min}
          maxScale={CanvasScale.max}
          initialPositionX={0}
          initialPositionY={0}
          wheel={{ smoothStep: 0.001 }}
          limitToBounds={true}
          centerZoomedOut={true}
          disablePadding={false}
          panning={{ velocityDisabled: false }}
          ref={interactiveRef}
          onInit={() => vm.reflow()}
          onPanningStart={() => {
            setIsPanning(true);
          }}
          onPanningStop={() => {
            setIsPanning(false);
          }}
          smooth
          onTransformed={(
            _ref: ReactZoomPanPinchRef,
            state: {
              scale: number;
              positionX: number;
              positionY: number;
            },
          ) => {
            mainController.setScale(state.scale);
            setState(state);
          }}
        >
          <TransformComponent
            wrapperStyle={{
              width: "100%",
              height: "100%",
              cursor: isPanning ? "grabbing" : "grab",
              boxSizing: "inherit",
            }}
            contentStyle={{
              flexFlow: "row wrap",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              gap: "1rem",
              boxSizing: "inherit",
              border: debugLayout ? "2px dashed pink" : undefined,
            }}
            contentClass={isPanning ? sharedStyle.CursorDragging : sharedStyle.CursorCanDrag}
          >
            <MasonryCanvas vm={vm} wrapper={interactiveRef?.current?.instance.wrapperComponent} />
          </TransformComponent>
          <div
            className={style.MinimapContainer}
            style={{
              opacity: showMinimap ? 0.8 : 0,
              transition: "opacity 0.2s ease-out",
            }}
          >
            <MiniMap
              previewStyles={{ borderColor: "orange" }}
              width={minimapWidth}
              height={minimapHeight}
            >
              <MiniMapContent masonryWidth={vm.canvasWidth} />
            </MiniMap>
          </div>
          <LegendComponent
            showLegend={showLegend}
            legendWidth={legendWidth}
            legendHeight={legendHeight}
          />
        </TransformWrapper>
      </div>
    );
  },
  { forwardRef: true },
);

export default observer(Canvas);
