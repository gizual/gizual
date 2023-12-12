import { IconCollapse } from "@app/assets";
import { Button } from "@app/primitives";
import shared from "@app/primitives/css/shared-styles.module.scss";
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
      <div className={clsx(style.DetailColumn, shared.FlexColumn, style.Grow)}>
        <div className={style.CollapsibleHeader}>
          {backArrow && <IconCollapse className={style.BackIcon} onClick={onBackArrow} />}
          <h1 className={clsx(style.DetailHeader, shared.Grow)}>Open from local file system</h1>
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
          .with({ id: "drag-and-drop" }, () => (
            <DragHandler onDrag={onDragAction}>
              <div className={style.GifPanel}>
                <img
                  src={isHoveringImage ? "fsa.gif" : "fsa.jpg"}
                  className={isHoveringImage ? style.Gif : style.GifPreview}
                  onMouseEnter={() => setHoveringImage(true)}
                  onMouseLeave={() => setHoveringImage(false)}
                  onClick={() => setHoveringImage(!isHoveringImage)}
                />
              </div>
            </DragHandler>
          ))
          .otherwise(() => (
            <>
              <div className={style.GifPanel}>
                <img
                  src={isHoveringImage ? "fsa.gif" : "fsa.jpg"}
                  className={isHoveringImage ? style.Gif : style.GifPreview}
                  onMouseEnter={() => setHoveringImage(true)}
                  onMouseLeave={() => setHoveringImage(false)}
                  onClick={() => setHoveringImage(!isHoveringImage)}
                />
              </div>

              <Button className={style.LoadButton} variant="filled" onClick={onButtonAction}>
                <LoadWithSelectedFileLoaderConfig selection={vm.selectedFileLoaderConfig} />
              </Button>
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
