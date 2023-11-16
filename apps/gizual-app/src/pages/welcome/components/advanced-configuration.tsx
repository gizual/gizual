import shared from "@app/primitives/css/shared-styles.module.scss";
import { Radio, RadioChangeEvent } from "antd";
import clsx from "clsx";

import style from "../welcome.module.scss";
import { WelcomeViewModel } from "../welcome.vm";

import { CollapsiblePanel } from "./collapsible-panel";

export type AdvancedConfigurationPanelProps = {
  vm: WelcomeViewModel;
};

export function AdvancedConfigurationPanel({ vm }: AdvancedConfigurationPanelProps) {
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
        <Radio value={"fsa"} className={style.Radio}>
          <div>
            <p className={clsx(shared["Text-Base"], shared["Text-Left"])}>File System Access API</p>
            <p className={clsx(shared["Text-Sm"], shared["Text-Left"])}>
              Only available in Chromium-based browsers.
            </p>
            <p className={style.NotSupportedText}>This loader is not supported on this device.</p>
          </div>
        </Radio>
        <Radio value={"html"}>HTML Input Field</Radio>
        <Radio value={"drag"}>Drag & Drop</Radio>
      </Radio.Group>
    </CollapsiblePanel>
  );
}
