import { SelectEntry } from "../select";

export class RepoPanelViewModel {
  private _selectBranchData: SelectEntry[];
  private _selectCommitData: SelectEntry[];
  private _toggleRangeValues: string[];

  constructor() {
    this._selectBranchData = [
      { value: "master", label: "master" },
      { value: "develop", label: "develop" },
      { value: "feature/1", label: "feature/1" },
      { value: "feature/2", label: "feature/2" },
    ];

    this._selectCommitData = [
      {
        value: "#b216bd3",
        label:
          "#b216bd3 - fix: update dependencies with a lot of text that probably won't fit and gets longer and longer and longer.",
      },
      { value: "#1a9fdbb", label: "#1a9fdbb - fix: update readme" },
      { value: "#2a9fdbb", label: "#2a9fdbb - chore: amazing feature with lots of text" },
    ];

    this._toggleRangeValues = ["Commit", "TimeRange"];
  }

  get selectBranchData() {
    return this._selectBranchData;
  }

  get selectCommitData() {
    return this._selectCommitData;
  }

  get toggleRangeValues() {
    return this._toggleRangeValues;
  }

  onBranchChange(value: string) {
    console.log("onBranchChange", value);
  }

  onCommitChange(value: string) {
    console.log("onCommitChange", value);
  }
}
