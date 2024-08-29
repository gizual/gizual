import { useMainController, useSettingsController } from "@app/controllers";
import { useViewModel } from "@app/services/view-model";
import { CanvasScale } from "@app/utils";
import { Alert } from "@mantine/core";
import clsx from "clsx";
import { ContextMenuContent, useContextMenu } from "mantine-contextmenu";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { useBlocks, useMetrics, useQuery, useSetScale } from "@giz/maestro/react";
import { AuthorPanel } from "../author-panel";
import sharedStyle from "../css/shared-styles.module.scss";
import { Timeline } from "../timeline";

import type { CanvasContextProps } from "./canvas.context";
import { CanvasContext } from "./canvas.context";
import style from "./canvas.module.scss";
import { CanvasViewModel } from "./canvas.vm";
import { LegendComponent } from "./components";
import { ContextModal } from "./components/context-modal";
import { MasonryCanvas } from "./components/file-canvas";
import { MiniMapContent, MiniMapWrapper } from "./minimap";

export type CanvasProps = {} & Partial<CanvasContextProps>;

/**
 * This is the main component that wraps around the interactive canvas element.
 * It also contains the timeline and toolbar elements.
 */
function Canvas({ ...contextProps }: CanvasProps) {
  const mainController = useMainController();
  const { query } = useQuery();

  const visibleTimeline =
    mainController.settingsController.settings.timelineSettings.displayMode.value === "visible";

  const vm = useViewModel(CanvasViewModel);

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
      <ContextModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      <div className={style.StageRow}>
        {visibleTimeline && (
          <>
            <Timeline />
            <hr />
          </>
        )}
        <div className={style.CanvasWrapper}>
          <CanvasContext.Provider
            value={{ useBlocks: useBlocks, debugLayout: false, rzppRef: ref, ...contextProps }}
          >
            <InteractiveCanvas vm={vm} showModal={showModal} />
          </CanvasContext.Provider>
          {query && query.preset && "paletteByAuthor" in query.preset && <AuthorPanel />}
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
const InteractiveCanvas = observer(
  React.forwardRef<HTMLDivElement, any>(
    ({ vm, showModal: _showModal }: InteractiveCanvasProps, ref) => {
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
        ],
        [vm],
      );

      return (
        <InnerCanvas
          vm={vm}
          ref={ref}
          onContextMenu={showContextMenu(contextMenu, {
            styles: { item: { backgroundColor: "var(--background-secondary)" } },
          })}
        />
      );
    },
  ),
);

type InnerCanvasProps = {
  vm: CanvasViewModel;
} & React.HTMLAttributes<HTMLDivElement>;

const InnerCanvas = observer<any, HTMLDivElement>(
  ({ vm, ...defaultProps }: InnerCanvasProps, ref) => {
    const mainController = useMainController();
    const settingsController = useSettingsController();
    const maestroSetScale = useSetScale();
    const { numSelectedFiles } = useMetrics();
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

    React.useEffect(() => {
      vm.center();
    }, [numSelectedFiles]);

    return (
      <div ref={ref} className={style.Canvas} {...defaultProps}>
        {debugLayout && (
          <div className={style.DebugOverlay}>
            <p className={sharedStyle["Text-Bold"]}>Canvas Debug Panel</p>
            <code>{`wrapper: ${wrapperWidth}px × ${wrapperHeight}px`}</code>
            <code>{`transform-component: ${contentWidth}px × ${contentHeight}px`}</code>
            <code>{`css transform: scale=${state.scale}, positionX=${state.positionX}px, positionY=${state.positionY}`}</code>
          </div>
        )}
        <div className={style.CanvasPaddingWrapper}>
          <div
            className={clsx(
              style.ErrorOverlay,
              errors && errors.length > 0 && style.ErrorOverlayVisible,
            )}
          >
            <Alert
              variant="transparent"
              color="#ff0000"
              title="Query invalid"
              styles={{
                message: { color: "white" },
                title: { color: "#ff0000", fontSize: "1.125rem", lineHeight: "1.75rem" },
              }}
            >
              <span>The query you entered was invalid. The following errors were found:</span>
              <table className={style.ErrorTable}>
                <thead>
                  <tr>
                    <td>Selector</td>
                    <td>Error</td>
                  </tr>
                </thead>
                <tbody>
                  {errors &&
                    errors.map((error, index) => (
                      <tr key={index}>
                        <td>{error.selector}</td>
                        <td>{error.message}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Alert>
          </div>
          {numSelectedFiles === 0 && !mainController.isLoading && (
            <div className={clsx(style.EmptySelectionOverlay)}>
              No files selected. Refine your query to start exploring!
            </div>
          )}
          <TransformWrapper
            initialScale={vm.initialScale ?? 1}
            minScale={CanvasScale.min}
            maxScale={CanvasScale.max}
            initialPositionX={0}
            initialPositionY={0}
            wheel={{
              smoothStep: 0.0035,
              step: settingsController.visualizationSettings.canvas.zoomStep.value ?? 0.15,
            }}
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
        </div>

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
          <div className={style.SidePanel__Bottom}>
            <LegendComponent legendWidth={legendWidth} legendHeight={legendHeight} />
            <a
              className={style.SidePanel__Link}
              onClick={() => mainController.setVisTypeModalOpen(true)}
            >
              Switch visualization type
            </a>
          </div>
        </div>
      </div>
    );
  },
  { forwardRef: true },
);

export default observer(Canvas);
