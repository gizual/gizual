import { MainController } from "../../controllers";
import { SelectEntry } from "../select";

export class RepoPanelViewModel {
  private _selectCommitData: SelectEntry[];
  private _toggleRangeValues: string[];
  private _mainController: MainController;

  constructor(mainController: MainController) {
    this._mainController = mainController;

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
    return this._mainController.branchNames.map((b) => ({ value: b, label: b }));
  }

  get selectedBranch() {
    return this._mainController.selectedBranch;
  }

  get selectedCommit() {
    return this._mainController.selectedCommit;
  }

  get selectCommitData() {
    return this._selectCommitData;
  }

  get toggleRangeValues() {
    return this._toggleRangeValues;
  }

  onBranchChange(value: string) {
    this._mainController.setBranchByName(value);
  }

  onCommitChange(value: string) {
    console.log("onCommitChange", value);
  }
}
