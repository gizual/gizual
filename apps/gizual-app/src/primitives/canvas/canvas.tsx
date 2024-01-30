import { IconCenterFocus, IconLayout, IconMagnifyMinus, IconMagnifyPlus } from "@app/assets";
import { useMainController, useViewModelController, ViewModelController } from "@app/controllers";
import { RenderedSettingsEntry } from "@app/pages";
import {
  CanvasScale,
  createNumberSetting,
  createSelectSetting,
  useForwardedRef,
  useTheme,
} from "@app/utils";
import { Modal, Tooltip } from "@mantine/core";
import { ContextMenuContent, useContextMenu } from "mantine-contextmenu";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { match } from "ts-pattern";

import { useBlocks, useQuery } from "@giz/maestro/react";
import { AuthorPanel } from "../author-panel";
import sharedStyle from "../css/shared-styles.module.scss";
import { GradientLegend } from "../gradient-legend";
import { IconButton } from "../icon-button";
import { Timeline } from "../timeline";

import type { CanvasContextProps } from "./canvas.context";
import { CanvasContext } from "./canvas.context";
import style from "./canvas.module.scss";
import { CanvasViewModel } from "./canvas.vm";
import { FileCanvas } from "./file-canvas";
import { MiniMap, MiniMapContent } from "./minimap";

export type CanvasProps = {
  vm?: CanvasViewModel;
} & Partial<CanvasContextProps>;

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

    const legendWidth = Math.min(wrapperWidth / 8, 200);
    const legendHeight = 50;
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
            <FileCanvas vm={vm} wrapper={interactiveRef?.current?.instance.wrapperComponent} />
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

type LegendProps = {
  showLegend: boolean;
  legendWidth: number;
  legendHeight: number;
};

const LegendComponent = React.memo(({ showLegend, legendWidth, legendHeight }: LegendProps) => {
  const { query } = useQuery();

  return match(query.type)
    .with("file-lines", "file-mosaic", () => {
      let colorStart = "#ff0000";
      let colorEnd = "#00ffff";
      let descriptionStart = "XXXX-XX-XX";
      let descriptionEnd = "XXXX-XX-XX";

      if (
        query.preset &&
        "gradientByAge" in query.preset &&
        query.time &&
        "rangeByDate" in query.time
      ) {
        colorStart = query.preset.gradientByAge[0];
        colorEnd = query.preset.gradientByAge[1];
        descriptionStart = query.time.rangeByDate[0];
        descriptionEnd = query.time.rangeByDate[1];
      } else {
        return <></>;
      }

      return (
        <div
          className={style.LegendContainer}
          style={{ opacity: showLegend ? 0.8 : 0, transition: "opacity 0.2s ease-out" }}
        >
          <GradientLegend
            width={legendWidth}
            height={legendHeight}
            startColor={colorStart}
            endColor={colorEnd}
            descriptionFn={(p, _) => {
              return match(p)
                .with(0, () => descriptionStart)
                .with(1, () => descriptionEnd)
                .otherwise(() => "ERROR");
            }}
          />
        </div>
      );
    })
    .otherwise(() => {
      return <></>;
    });
});

const Toolbar = observer<any, HTMLDivElement>(
  ({ vm }: { vm: CanvasViewModel; vmController: ViewModelController }, ref) => {
    const toolbarRef = useForwardedRef(ref);
    return (
      <div className={style.Toolbar} ref={toolbarRef}>
        <div className={sharedStyle.InlineColumn}>
          <Tooltip label={"Zoom out"} position="right">
            <IconButton
              className={style.ToolbarButton}
              onClick={() => vm.zoomOut()}
              aria-label="Zoom out"
            >
              <IconMagnifyMinus className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip label={"Zoom in"} position="right">
            <IconButton
              className={style.ToolbarButton}
              onClick={() => vm.zoomIn()}
              aria-label="Zoom in"
            >
              <IconMagnifyPlus className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip label={"Center"} position="right">
            <IconButton
              className={style.ToolbarButton}
              onClick={() => vm.resetScale()}
              aria-label="Center"
            >
              <IconCenterFocus className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip label={"Reflow"} position="right">
            <IconButton
              className={style.ToolbarButton}
              onClick={() => vm.reflow()}
              aria-label="Reflow"
            >
              <IconLayout className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    );
  },
  { forwardRef: true },
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
      <Modal title="Export to SVG" opened={isModalOpen} onClose={handleOk} onAbort={handleCancel}>
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
