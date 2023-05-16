import { MainController } from "../../controllers";
import { makeAutoObservable } from "mobx";

export class SettingsPanelViewModel {
  private _toggleColoringValues: string[];
  private _toggleLineLengthScalingValues: string[];
  private _mainController: MainController;

  constructor(mainController: MainController) {
    this._toggleColoringValues = ["By Age", "By Author"];
    this._toggleLineLengthScalingValues = ["Local", "Global"];
    this._mainController = mainController;

    makeAutoObservable(this);
  }

  onLineLengthScalingChange = (value: number) => {
    this._mainController.setLineLengthScaling(this.toggleLineLengthScalingValues[value] as any);
  };

  onColoringModeChange = (value: number) => {
    this._mainController.setColoringMode(this.toggleColoringValues[value] as any);
  };

  get toggleColoringValues() {
    return this._toggleColoringValues;
  }

  get toggleLineLengthScalingValues() {
    return this._toggleLineLengthScalingValues;
  }
}
