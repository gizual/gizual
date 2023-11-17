import { IconCollapse } from "@app/assets";
import { Button } from "@app/primitives";
import shared from "@app/primitives/css/shared-styles.module.scss";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import {
  FileLoader,
  FileLoaderDragAndDrop,
  FileLoaderFSA,
  FileLoaderInputField,
  FileLoaderLocal,
  FileLoaderUrl,
  FileLoaderZipFile,
} from "@giz/maestro/react";
import { Content } from "../content/type";
import style from "../welcome.module.scss";
import { getLoaderForConfig, showFilePicker, WelcomeViewModel } from "../welcome.vm";

import { AdvancedConfigurationPanel } from "./advanced-configuration";
import { DragHandler } from "./drag-handler";

type DetailPanelProps = {
  source: "local" | "zip" | "url";
  content?: Content;
  loader: FileLoader;
  backArrow?: boolean;
  onBackArrow?: () => void;
  vm: WelcomeViewModel;
};

export const DetailPanel = observer(
  ({
    source,
    loader,
    content,
    backArrow = false,
    onBackArrow = () => {},
    vm,
  }: DetailPanelProps) => {
    const actionStyle: "drag" | "button" =
      source === "local" && vm.selectedFileLoaderConfig === "drag-and-drop" ? "drag" : "button";

    let selectedLoader: FileLoaderLocal | FileLoaderZipFile | FileLoaderUrl | undefined;
    if (source === "local") {
      selectedLoader = getLoaderForConfig(loader as FileLoaderLocal[], vm.selectedFileLoaderConfig);
    } else if (!Array.isArray(loader)) {
      selectedLoader = loader;
    }

    const onAction = (e: any) => {
      if (source === "local") {
        if (content?.hasConfigPanel && vm.selectedFileLoaderConfig === "fsa") {
          window.showDirectoryPicker().then((handle) => {
            (selectedLoader as FileLoaderFSA).load(handle);
          });
        } else if (content?.hasConfigPanel && vm.selectedFileLoaderConfig === "input-field") {
          showFilePicker("directory").then((files) => {
            (selectedLoader as FileLoaderInputField).load(files);
          });
        } else if (content?.hasConfigPanel && vm.selectedFileLoaderConfig === "drag-and-drop") {
          if (!e) return;
          (selectedLoader as FileLoaderDragAndDrop).load(e as any); // TODO: Fix that any! :)
        }
      } else if (source === "zip") {
        showFilePicker("zip").then((files) => {
          (selectedLoader as FileLoaderZipFile).load(files[0]);
        });
      }
    };

    if (!content) {
      return <div></div>;
    }

    return (
      <div className={clsx(style.DetailColumn, shared.FlexColumn, style.Grow)}>
        <div className={style.CollapsibleHeader}>
          {backArrow && <IconCollapse className={style.BackIcon} onClick={onBackArrow} />}
          <h1 className={clsx(style.DetailHeader, shared.Grow)}>{content.header}</h1>
        </div>

        {content.description.map((d, index) => (
          <p key={index} className={style.DetailDescription}>
            {d}
          </p>
        ))}

        {content.hasConfigPanel && (
          <AdvancedConfigurationPanel vm={vm} loader={loader as FileLoaderLocal[]} />
        )}

        {actionStyle === "button" && content.hasGif && <div className={style.GifPanel} />}
        {actionStyle === "drag" && content.hasGif && (
          <DragHandler onDrag={onAction}>
            <div className={style.GifPanel} />
          </DragHandler>
        )}

        {actionStyle === "button" && (
          <Button className={style.LoadButton} variant="filled" onClick={onAction}>
            {`Load with ${selectedLoader ? selectedLoader.name : content.button}`}
          </Button>
        )}
      </div>
    );
  },
);
