import { IconCollapse } from "@app/assets";
import { Button } from "@app/primitives";
import shared from "@app/primitives/css/shared-styles.module.scss";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";
import { match } from "ts-pattern";

import { FileLoaderLocal } from "@giz/maestro/react";
import style from "../../welcome.module.scss";
import {
  AdvancedConfigurationSelection,
  getLoaderForConfig,
  showFilePicker,
} from "../../welcome.vm";
import { AdvancedConfigurationPanel } from "../advanced-configuration";
import { DragHandler } from "../drag-handler";

import { DetailPanelProps } from "./detail-panel";

type FilesDetailPanel = {
  loaders: FileLoaderLocal[];
} & Omit<DetailPanelProps, "loader">;

export const FilesDetailPanel = observer(
  ({ vm, loaders, backArrow, onBackArrow }: FilesDetailPanel) => {
    const selectedLoader = getLoaderForConfig(loaders, vm.selectedFileLoaderConfig);
    const onButtonAction = () => {
      if (!selectedLoader) return;

      match(selectedLoader)
        .with({ id: "fsa" }, (loader) => {
          window.showDirectoryPicker().then((handle) => {
            loader.load(handle);
          });
        })
        .with({ id: "input-field" }, (loader) => {
          showFilePicker("directory").then((files) => {
            loader.load(files);
          });
        })
        .with({ id: "native-file-picker" }, (_loader) => {
          throw new Error("Not implemented!");
        });
    };

    const onDragAction = (e: FileSystemDirectoryEntry) => {
      if (!selectedLoader) return;

      match(selectedLoader)
        .with({ id: "drag-and-drop" }, (loader) => {
          loader.load(e);
        })
        .otherwise(() => {
          throw new Error("Not implemented!");
        });
    };

    const [isHoveringImage, setHoveringImage] = React.useState(false);

    return (
      <div className={clsx(style.DetailColumn)}>
        <div className={style.CollapsibleHeader}>
          {backArrow && <IconCollapse className={style.BackIcon} onClick={onBackArrow} />}
          <h1 className={clsx(style.DetailHeader, shared.Grow)}>Open from local directory</h1>
        </div>

        <p className={style.DetailDescription}>
          Open a folder from your local file system. None of your files will be uploaded anywhere,
          all your data is processed locally on your own device.
        </p>
        <p className={style.DetailDescription}>
          You can pick a custom loader configuration below, or leave it default to choose the best
          loader for your current browser context.
        </p>

        <AdvancedConfigurationPanel vm={vm} loader={loaders} />

        {match(selectedLoader)
          .with({ id: "fsa" }, () => (
            <>
              <div
                className={style.GifPanel}
                onMouseEnter={() => setHoveringImage(true)}
                onMouseLeave={() => setHoveringImage(false)}
                onClick={() => setHoveringImage(!isHoveringImage)}
              >
                <div
                  className={clsx(
                    style.GifDescription,
                    sharedStyle.TransitionOpacity,
                    isHoveringImage ? sharedStyle.Opacity0 : sharedStyle.Opacity100,
                  )}
                >
                  <h2 className={clsx(sharedStyle["Text-Bold"], sharedStyle["Text-2Xl"])}>
                    File System Access API
                  </h2>
                  <span>Hover or tap for a demo.</span>
                </div>
                <video
                  src={isHoveringImage ? "welcome-fsa.mp4" : undefined}
                  autoPlay
                  loop
                  muted
                  className={clsx(
                    style.Gif,
                    isHoveringImage ? sharedStyle.Visible : sharedStyle.Hidden,
                  )}
                />
              </div>

              <Button className={style.LoadButton} variant="filled" onClick={onButtonAction}>
                <LoadWithSelectedFileLoaderConfig selection={vm.selectedFileLoaderConfig} />
              </Button>
            </>
          ))
          .with({ id: "drag-and-drop" }, () => (
            <DragHandler onDrag={onDragAction}>
              <div
                className={style.GifPanel}
                onMouseEnter={() => setHoveringImage(true)}
                onMouseLeave={() => setHoveringImage(false)}
                onClick={() => setHoveringImage(!isHoveringImage)}
              >
                <div
                  className={clsx(
                    style.GifDescription,
                    sharedStyle.TransitionOpacity,
                    isHoveringImage ? sharedStyle.Opacity0 : sharedStyle.Opacity100,
                  )}
                >
                  <h2 className={clsx(sharedStyle["Text-Bold"], sharedStyle["Text-2Xl"])}>
                    Drag & Drop Input
                  </h2>
                  <span>Hover or tap for a demo.</span>
                  <span style={{ marginTop: "1rem" }}>Drag your folder here!</span>
                </div>
                <video
                  src={isHoveringImage ? "welcome-drag.mp4" : undefined}
                  autoPlay
                  loop
                  muted
                  className={clsx(
                    style.Gif,
                    isHoveringImage ? sharedStyle.Visible : sharedStyle.Hidden,
                  )}
                />
              </div>
            </DragHandler>
          ))
          .with({ id: "input-field" }, () => (
            <>
              <div
                className={style.GifPanel}
                onMouseEnter={() => setHoveringImage(true)}
                onMouseLeave={() => setHoveringImage(false)}
                onClick={() => setHoveringImage(!isHoveringImage)}
              >
                <div
                  className={clsx(
                    style.GifDescription,
                    sharedStyle.TransitionOpacity,
                    isHoveringImage ? sharedStyle.Opacity0 : sharedStyle.Opacity100,
                  )}
                >
                  <h2 className={clsx(sharedStyle["Text-Bold"], sharedStyle["Text-2Xl"])}>
                    HTML Input Field
                  </h2>
                  <span>Hover or tap for a demo.</span>
                </div>
                <video
                  src={isHoveringImage ? "welcome-input.mp4" : undefined}
                  autoPlay
                  loop
                  muted
                  className={clsx(
                    style.Gif,
                    isHoveringImage ? sharedStyle.Visible : sharedStyle.Hidden,
                  )}
                />
              </div>

              <Button className={style.LoadButton} variant="filled" onClick={onButtonAction}>
                <LoadWithSelectedFileLoaderConfig selection={vm.selectedFileLoaderConfig} />
              </Button>
            </>
          ))
          .otherwise(() => (
            <>
              <div className={style.GifPanel}>
                <div className={clsx(style.GifDescription)}>
                  <h2 className={clsx(sharedStyle["Text-Bold"], sharedStyle["Text-2Xl"])}>
                    Unknown loader.
                  </h2>
                  <span>No demo available.</span>
                </div>
              </div>
            </>
          ))}
      </div>
    );
  },
);

const LoadWithSelectedFileLoaderConfig = observer(
  ({ selection }: { selection: AdvancedConfigurationSelection }) => {
    return (
      <>
        {match(selection)
          .with("fsa", () => "Load with File System Access API")
          .with("input-field", () => "Select folder to load")
          .with("native-file-picker", () => "Select folder to load")
          .with("drag-and-drop", () => "Load via drag & drop")
          .otherwise(() => "Load")}
      </>
    );
  },
);
