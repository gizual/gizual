import { makeAutoObservable } from "mobx";

import { MainController } from "../../controllers";

const LineLengthScalingValues = ["Local", "Global"] as const;
export type LineLengthScaling = (typeof LineLengthScalingValues)[number];

function isLineLengthScaling(value: string): value is LineLengthScaling {
  return LineLengthScalingValues.includes(value as LineLengthScaling);
}

const ColoringModeValues = ["By Age", "By Author"] as const;
export type ColoringMode = (typeof ColoringModeValues)[number];

function isColoringMode(value: string): value is ColoringMode {
  return ColoringModeValues.includes(value as ColoringMode);
}

export class SettingsPanelViewModel {
  private _mainController: MainController;

  constructor(mainController: MainController) {
    this._mainController = mainController;

    makeAutoObservable(this);
  }

  onLineLengthScalingChange = (value: string) => {
    if (!isLineLengthScaling(value)) {
      return;
    }
    this._mainController.setLineLengthScaling(value);
  };

  onColoringModeChange = (value: string) => {
    if (!isColoringMode(value)) {
      return;
    }
    this._mainController.setColoringMode(value);
  };

  get toggleColoringValues() {
    return ColoringModeValues;
  }

  get toggleLineLengthScalingValues() {
    return LineLengthScalingValues;
  }
}
