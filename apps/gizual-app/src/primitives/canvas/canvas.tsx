import { useMainController, useViewModelController } from "@app/controllers";
import { CanvasScale } from "@app/utils";
import { Alert } from "@mantine/core";
import clsx from "clsx";
import { ContextMenuContent, useContextMenu } from "mantine-contextmenu";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { useBlocks, useQuery, useSetScale } from "@giz/maestro/react";
import { AuthorPanel } from "../author-panel";
import sharedStyle from "../css/shared-styles.module.scss";
import { Timeline } from "../timeline";

import type { CanvasContextProps } from "./canvas.context";
import { CanvasContext } from "./canvas.context";
import style from "./canvas.module.scss";
import { CanvasViewModel } from "./canvas.vm";
import { LegendComponent, MasonryCanvas, Toolbar } from "./components";
import { ContextModal } from "./components/context-modal";
import { MiniMapContent, MiniMapWrapper } from "./minimap";

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

  return (
    <div className={style.Stage}>
      <ContextModal vm={vm} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      <div className={style.StageRow}>
        {visibleTimeline && (
          <>
            <Timeline vm={mainController.vmController.timelineViewModel} />
            <hr />
          </>
        )}
        <div className={style.CanvasWrapper}>
          <CanvasContext.Provider
            value={{ useBlocks: useBlocks, debugLayout: false, rzppRef: ref, ...contextProps }}
          >
            <Toolbar vm={vm} vmController={vmController} />
            <InteractiveCanvas vm={vm} showModal={showModal} />
          </CanvasContext.Provider>
          {vmController.isAuthorPanelVisible && <AuthorPanel />}
        </div>
      </div>
    </div>
  );
}

type InteractiveCanvasProps = {
  vm: CanvasViewModel;
  showModal: () => void;
};

/**
 * This is the main canvas element that contains the individual blocks, wrapped inside
 * the `react-zoom-pan-pinch` wrapper component.
 */
const InteractiveCanvas = observer<any, HTMLDivElement>(
  ({ vm, showModal }: InteractiveCanvasProps, ref) => {
    const { showContextMenu } = useContextMenu();
    const contextMenu: ContextMenuContent = React.useMemo(
      () => [
        {
          key: "1",
          title: "Reset zoom",
          onClick: () => {
            vm.center();
          },
        },
        {
          key: "2",
          title: "Export entire canvas as SVG",
          onClick: () => {
            showModal();
          },
        },
      ],
      [vm, showModal],
    );

    return <InnerCanvas vm={vm} ref={ref} onContextMenu={showContextMenu(contextMenu)} />;
  },
  { forwardRef: true },
);

type InnerCanvasProps = {
  vm: CanvasViewModel;
} & React.HTMLAttributes<HTMLDivElement>;

const CANVAS_PADDING = 16;

const InnerCanvas = observer<any, HTMLDivElement>(
  ({ vm, ...defaultProps }: InnerCanvasProps, ref) => {
    const mainController = useMainController();
    const maestroSetScale = useSetScale();
    const rzppRef = React.useContext(CanvasContext).rzppRef;
    const [isPanning, setIsPanning] = useState(false);
    const [state, setState] = useState<{ scale: number; positionX: number; positionY: number }>({
      scale: 1,
      positionX: 0,
      positionY: 0,
    });
    const { errors } = useQuery();

    const wrapperComponent = rzppRef?.current?.instance.wrapperComponent;
    const contentComponent = rzppRef?.current?.instance.contentComponent;

    const wrapperWidth = wrapperComponent?.clientWidth ?? 0;
    const wrapperHeight = wrapperComponent?.clientHeight ?? 0;

    const contentWidth = contentComponent?.clientWidth ?? 0;
    const contentHeight = contentComponent?.clientHeight ?? 0;

    const { debugLayout } = React.useContext(CanvasContext);

    const legendWidth = Math.min(wrapperWidth / 10 + 100, 200);
    const legendHeight = 60;

    // TODO: This is counter-intuitive because the minimap component decides on it's dimensions
    // even if we pass it a width and height. We should probably fix this in the minimap component.
    const minimapWidth = Math.min(wrapperWidth / 10 + 100, 200);
    const minimapHeight = wrapperHeight - legendHeight - 16;

    React.useEffect(() => {
      maestroSetScale(vm.initialScale);
      rzppRef.current?.setTransform(0, 0, vm.initialScale);
    }, [vm.initialScale]);

    return (
      <div ref={ref} className={style.Canvas} {...defaultProps} style={{ padding: CANVAS_PADDING }}>
        {debugLayout && (
          <div className={style.DebugOverlay}>
            <p className={sharedStyle["Text-Bold"]}>Canvas Debug Panel</p>
            <code>{`wrapper: ${wrapperWidth}px × ${wrapperHeight}px`}</code>
            <code>{`transform-component: ${contentWidth}px × ${contentHeight}px`}</code>
            <code>{`css transform: scale=${state.scale}, positionX=${state.positionX}px, positionY=${state.positionY}`}</code>
          </div>
        )}
        <div
          className={clsx(
            style.ErrorOverlay,
            errors && errors.length > 0 && style.ErrorOverlayVisible,
          )}
        >
          <Alert variant="light" color="red" title="Query invalid">
            The query you entered was invalid. TODO: This is where we put a detailed list of errors.
            <pre style={{ marginTop: "1rem" }}>{JSON.stringify(errors, undefined, 2)}</pre>
          </Alert>
        </div>
        <TransformWrapper
          initialScale={vm.initialScale ?? 1}
          minScale={CanvasScale.min}
          maxScale={CanvasScale.max}
          initialPositionX={0}
          initialPositionY={0}
          wheel={{ smoothStep: 0.001 }}
          limitToBounds={true}
          centerZoomedOut={true}
          disablePadding={false}
          panning={{ velocityDisabled: false }}
          ref={rzppRef}
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
            maestroSetScale(state.scale);
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
              width: vm.requiredWidth,
            }}
            contentClass={isPanning ? sharedStyle.CursorDragging : sharedStyle.CursorCanDrag}
          >
            <MasonryCanvas vm={vm} wrapper={wrapperComponent} />
          </TransformComponent>
        </TransformWrapper>

        <div className={style.Vr} />

        <div className={style.SidePanel}>
          <div className={style.MinimapContainer}>
            <MiniMapWrapper
              previewStyles={{ borderColor: "var(--accent-main)" }}
              width={minimapWidth}
              height={minimapHeight}
            >
              <MiniMapContent
                numColumns={
                  mainController.settingsController.settings.visualizationSettings.canvas
                    .masonryColumns.value
                }
              />
            </MiniMapWrapper>
          </div>
          <LegendComponent legendWidth={legendWidth} legendHeight={legendHeight} />
        </div>
      </div>
    );
  },
  { forwardRef: true },
);

export default observer(Canvas);
