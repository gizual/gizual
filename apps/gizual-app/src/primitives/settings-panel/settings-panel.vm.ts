export class SettingsPanelViewModel {
  private _toggleColoringValues: string[];
  private _toggleLineLengthScalingValues: string[];
  constructor() {
    this._toggleColoringValues = ["By Age", "By Author"];
    this._toggleLineLengthScalingValues = ["Local", "Global"];
  }

  get toggleColoringValues() {
    return this._toggleColoringValues;
  }

  get toggleLineLengthScalingValues() {
    return this._toggleLineLengthScalingValues;
  }
}
