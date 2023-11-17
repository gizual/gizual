import shared from "@app/primitives/css/shared-styles.module.scss";
import { Radio, RadioChangeEvent } from "antd";
import clsx from "clsx";
import { match } from "ts-pattern";

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

  return (
    <CollapsiblePanel title="Advanced configuration" titleStyle={style.AdvancedConfigurationTitle}>
      <Radio.Group
        className={clsx(shared.FlexColumn, shared["Gap-2"])}
        value={vm.selectedFileLoaderConfig}
        onChange={onChange}
      >
        {loader.map((l) => (
          <Radio value={l.id} className={style.Radio} key={l.id}>
            {match(l.id)
              .with("fsa", () => <FsaLoader />)
              .with("drag-and-drop", () => <DragLoader />)
              .with("input-field", () => <HTMLInputLoader />)
              .otherwise(() => (
                <div>Unknown loader</div>
              ))}
          </Radio>
        ))}
      </Radio.Group>
    </CollapsiblePanel>
  );
}

function FsaLoader() {
  return (
    <div>
      <p className={clsx(shared["Text-Base"], shared["Text-Left"])}>File System Access API</p>
      <p className={clsx(shared["Text-Sm"], shared["Text-Left"])}>
        Only available in Chromium-based browsers.
      </p>
      <p className={style.NotSupportedText}>This loader is not supported on this device.</p>
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
