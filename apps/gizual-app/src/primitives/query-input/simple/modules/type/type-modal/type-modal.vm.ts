import { Dependencies, ViewModel } from "@app/services/view-model";
import { action, computed, makeObservable } from "mobx";
import { match } from "ts-pattern";

import type { PresetQueryKeys, RenderTypeQueryType } from "@giz/query";

class VisTypeViewModel extends ViewModel {
  constructor({ mainController }: Dependencies, ...args: any[]) {
    super({ mainController }, ...args);
    makeObservable(this, undefined);
  }

  get localQueryManager() {
    if (!this._mainController.localQueryManager)
      throw new Error("LocalQueryManager instance not found within VisTypeVM.");

    return this._mainController.localQueryManager;
  }

  @computed
  get queryGradientColors() {
    return (
      this.localQueryManager.presetKey === "gradientByAge" ? this.localQueryManager?.colors : []
    ) as string[];
  }

  @computed
  get queryGradientColorsWithFallback() {
    if (this.queryGradientColors && this.queryGradientColors.length > 0)
      return this.queryGradientColors;

    return [
      this._mainController.settingsController.settings.visualizationSettings.colors.old.value,
      this._mainController.settingsController.settings.visualizationSettings.colors.new.value,
    ];
  }

  @computed
  get queryAuthorColors() {
    return (
      this.localQueryManager.presetKey === "paletteByAuthor" ? this.localQueryManager?.colors : []
    ) as [string, string][];
  }

  get selectedType() {
    return this._mainController.localQueryManager?.type ?? "file-lines";
  }

  @action.bound
  setSelectedType(type: RenderTypeQueryType) {
    this.localQueryManager.updateLocalQuery({ type });
  }

  get selectedPreset() {
    return this._mainController.localQueryManager?.presetKey ?? "gradientByAge";
  }

  @action.bound
  setSelectedPreset(preset: PresetQueryKeys) {
    match(preset)
      .with("gradientByAge", () => {
        this.localQueryManager.updateLocalQuery({
          preset: { gradientByAge: this.queryGradientColorsWithFallback },
        });
      })
      .with("paletteByAuthor", () => {
        this.localQueryManager.updateLocalQuery({
          preset: { paletteByAuthor: this.queryAuthorColors },
        });
      });
  }

  @action.bound
  setGradientColors(colors: string[]) {
    this.localQueryManager.updateLocalQuery({ preset: { gradientByAge: colors } });
  }

  @action.bound
  setAuthorColors(colors: [string, string][]) {
    this.localQueryManager.updateLocalQuery({ preset: { paletteByAuthor: colors } });
  }

  @action.bound
  apply() {
    this.localQueryManager.publishLocalQuery();
  }

  @action.bound
  discard() {
    this.localQueryManager.resetLocalQuery();
  }
}

export { VisTypeViewModel };
