import shared from "@app/primitives/css/shared-styles.module.scss";
import { Radio, RadioChangeEvent } from "antd";
import clsx from "clsx";
import React from "react";

import { FileLoaderLocal } from "@giz/maestro/react";
import style from "../welcome.module.scss";
import { WelcomeViewModel } from "../welcome.vm";

import { CollapsiblePanel } from "./collapsible-panel";

export type AdvancedConfigurationPanelProps = {
  vm: WelcomeViewModel;
  loader: FileLoaderLocal[];
};

export function AdvancedConfigurationPanel({ vm, loader }: AdvancedConfigurationPanelProps) {
  function onChange(e: RadioChangeEvent) {
    vm.setSelectedFileLoaderConfig(e.target.value);
  }

  const isFsaSupported = loader.some((l) => l.id === "fsa");
  const isDragAndDropSupported = loader.some((l) => l.id === "drag-and-drop");
  const isInputFieldSupported = loader.some((l) => l.id === "input-field");

  React.useEffect(() => {
    loader.length > 0 && vm.setSelectedFileLoaderConfig(loader.map((l) => l.id)[0]);
  }, [loader]);

  return (
    <CollapsiblePanel title="Advanced configuration" titleStyle={style.AdvancedConfigurationTitle}>
      <Radio.Group
        className={clsx(shared.FlexColumn, shared["Gap-2"])}
        value={vm.selectedFileLoaderConfig}
        onChange={onChange}
      >
        <Radio value={"fsa"} className={style.Radio} disabled={!isFsaSupported}>
          <FsaLoader isFsaSupported={isFsaSupported} />
        </Radio>

        <Radio value={"drag-and-drop"} className={style.Radio} disabled={!isDragAndDropSupported}>
          <DragLoader />
        </Radio>

        <Radio value={"input-field"} className={style.Radio} disabled={!isInputFieldSupported}>
          <HTMLInputLoader />
        </Radio>
      </Radio.Group>
    </CollapsiblePanel>
  );
}

function FsaLoader({ isFsaSupported }: { isFsaSupported: boolean }) {
  return (
    <div>
      <p className={clsx(shared["Text-Base"], shared["Text-Left"])}>File System Access API</p>
      <p className={clsx(shared["Text-Sm"], shared["Text-Left"])}>
        Only available in Chromium-based browsers.
      </p>
      {!isFsaSupported && (
        <p className={style.NotSupportedText}>This loader is not supported on this device.</p>
      )}
    </div>
  );
}

function HTMLInputLoader() {
  return (
    <div>
      <p className={clsx(shared["Text-Base"], shared["Text-Left"])}>HTML Input Field</p>
      <p className={clsx(shared["Text-Sm"], shared["Text-Left"])}>
        Loads the file using the standard HTML input element.
      </p>
    </div>
  );
}

function DragLoader() {
  return (
    <div>
      <p className={clsx(shared["Text-Base"], shared["Text-Left"])}>Drag & Drop</p>
      <p className={clsx(shared["Text-Sm"], shared["Text-Left"])}>
        Allows folder input via drag & drop.
      </p>
    </div>
  );
}
