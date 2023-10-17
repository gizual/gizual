import { RenderedSettingsEntry } from "@app/pages";
import { createNumberSetting, createSelectSetting, useTheme } from "@app/utils";
import { ColorPicker, Dropdown, InputNumber, MenuProps, Modal, Radio, Spin, Tooltip } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { ReactComponent as Center } from "../../assets/icons/center-focus.svg";
import { ReactComponent as Layout } from "../../assets/icons/layout.svg";
import { ReactComponent as MagnifyMinus } from "../../assets/icons/magnify-minus-outline.svg";
import { ReactComponent as MagnifyPlus } from "../../assets/icons/magnify-plus-outline.svg";
import { ReactComponent as People } from "../../assets/icons/people.svg";
import {
  useMainController,
  useSettingsController,
  useViewModelController,
} from "../../controllers";
import { AuthorPanel } from "../author-panel";
import sharedStyle from "../css/shared-styles.module.scss";
import { File } from "../file/";
import { IconButton } from "../icon-button";
import { Timeline } from "../timeline";

import style from "./canvas.module.scss";
import { CanvasViewModel, MAX_ZOOM, MIN_ZOOM } from "./canvas.vm";

export type CanvasProps = {
  vm?: CanvasViewModel;
};

type MasonryGridProps = {
  children: React.ReactElement[];
  heights: number[];
  width: number;
  css?: React.CSSProperties;
  className?: string;
};

type Column = {
  elements: React.ReactElement[];
  height: number;
  index: number;
};

function sortChildrenToColumns(
  children: React.ReactElement[],
  heights: number[],
  columns: Column[],
) {
  const sortedColumns = [...columns];
  for (const [index, child] of children.entries()) {
    sortedColumns.sort((a, b) => a.height - b.height);
    const smallestColumn = sortedColumns.at(0);
    if (smallestColumn === undefined) return;
    smallestColumn.elements.push(child);
    smallestColumn.height += heights[index];
  }
  return sortedColumns;
}

const MasonryGrid = observer(({ children, css, className, width, heights }: MasonryGridProps) => {
  const sortedColumns = React.useMemo(() => {
    const cols: Column[] = [];
    for (let i = 16; i < width - 16; i += 350 + 32) {
      cols.push({ index: i, elements: [], height: 0 });
    }
    const sorted = sortChildrenToColumns(children, heights, cols);
    return sorted;
  }, [children, heights]);

  return (
    <div className={clsx(style.Row, className)} style={{ ...css }}>
      {sortedColumns &&
        sortedColumns.map((c) => {
          return (
            <div className={style.Column} key={c.index}>
              {c.elements.map((e, index) => (
                <React.Fragment key={index}>{e}</React.Fragment>
              ))}
            </div>
          );
        })}
    </div>
  );
});

function Canvas({ vm: externalVm }: CanvasProps) {
  const mainController = useMainController();
  const vmController = useViewModelController();
  const settingsController = useSettingsController();

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

  return (
    <div className={style.Stage}>
      {visibleTimeline && (
        <>
          <Timeline vm={mainController.vmController.timelineViewModel} />
          <hr />
        </>
      )}
      <div className={style.Toolbar}>
        <div className={sharedStyle.InlineRow}>
          <Tooltip title={"Zoom out"}>
            <IconButton onClick={() => vm.zoomOut()} aria-label="Zoom out">
              <MagnifyMinus className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
          <InputNumber
            value={currentZoomLevel}
            suffix={"%"}
            onChange={(i) => vm.zoomTo(i)}
            size={"large"}
            controls={false}
          />
          <Tooltip title={"Zoom in"}>
            <IconButton onClick={() => vm.zoomIn()} aria-label="Zoom in">
              <MagnifyPlus className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip title={"Center"}>
            <IconButton onClick={() => vm.center(1)} aria-label="Center">
              <Center className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip title={"Reflow"}>
            <IconButton
              onClick={() => {
                vm.reflow();
              }}
              aria-label="Reflow"
            >
              <Layout className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>

          {mainController._colouringMode === "age" && (
            <>
              <div className={style.Separator}></div>
              <div className={style.ControlWithLabel}>
                <p className={style["ControlWithLabel__Label"]}>Old changes:</p>
                <ColorPicker
                  value={settingsController.settings.visualisationSettings.colours.old.value}
                  showText
                  size="small"
                  format="hex"
                  onChangeComplete={(e) => {
                    settingsController.updateValue(
                      settingsController.settings.visualisationSettings.colours.old,
                      `#${e.toHex(false)}`,
                    );
                  }}
                  className={sharedStyle.colorPicker}
                />
              </div>
              <div className={style.Separator}></div>
              <div className={style.ControlWithLabel}>
                <p className={style["ControlWithLabel__Label"]}>New changes:</p>
                <ColorPicker
                  value={settingsController.settings.visualisationSettings.colours.new.value}
                  showText
                  size="small"
                  format="hex"
                  onChangeComplete={(e) => {
                    settingsController.updateValue(
                      settingsController.settings.visualisationSettings.colours.new,
                      `#${e.toHex(false)}`,
                    );
                  }}
                  className={sharedStyle.colorPicker}
                />
              </div>
            </>
          )}
        </div>
        <div className={sharedStyle.InlineRow}>
          <div className={style.ControlWithLabel}>
            <p className={style["ControlWithLabel__Label"]}>Colouring mode:</p>
            <Radio.Group
              buttonStyle={"solid"}
              value={mainController.colouringMode}
              onChange={(n) => vm.onColouringModeChange(n.target.value)}
              size="small"
              style={{ display: "flex", flexDirection: "row" }}
            >
              {vm.toggleColouringValues.map((v) => (
                <Radio.Button key={v.value} value={v.value} style={{ whiteSpace: "nowrap" }}>
                  {v.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
          <div className={style.Separator}></div>
          <Tooltip title={"Show author panel"}>
            <IconButton
              onClick={() => vmController.toggleAuthorPanelVisibility()}
              aria-label="Toggle author panel"
              coloured={vmController.isAuthorPanelVisible}
            >
              <People className={sharedStyle.ToolbarIcon} />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className={style.CanvasWrapper}>
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
              "Controls the background and font colours of the exported SVG.",
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
              >
                {!vm.hasLoadedFiles && (
                  <h2>No files loaded. Use the search bar to select something.</h2>
                )}
                {vm.hasLoadedFiles && (
                  <>
                    {!mainController.repoController.isDoneEstimatingSize && (
                      <>
                        <h2>Estimating size - please wait.</h2>
                        <Spin size={"large"} />
                      </>
                    )}
                    {mainController.repoController.isDoneEstimatingSize && (
                      <MasonryGrid
                        width={vm.canvasWidth}
                        heights={vm.loadedFiles.map((f) => f.calculatedHeight)}
                      >
                        {vm.loadedFiles.map((file, index) => {
                          if (!ref.current?.instance.wrapperComponent || !file.isValid)
                            return <React.Fragment key={index}></React.Fragment>;

                          return (
                            <File
                              file={file}
                              key={index}
                              parentContainer={ref.current?.instance.wrapperComponent}
                            />
                          );
                        })}
                      </MasonryGrid>
                    )}
                  </>
                )}
              </TransformComponent>
            </TransformWrapper>
          </div>
        </Dropdown>
        {vmController.isAuthorPanelVisible && <AuthorPanel />}
      </div>
    </div>
  );
}

export default observer(Canvas);
